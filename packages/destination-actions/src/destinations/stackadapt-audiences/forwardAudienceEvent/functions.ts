import { RequestClient } from '@segment/actions-core'
import isEmpty from 'lodash/isEmpty'
import { Payload } from './generated-types'
import { GQL_ENDPOINT, EXTERNAL_PROVIDER, sha256hash, stringifyJsonWithEscapedQuotes, stringifyMappingSchemaForGraphQL } from '../functions'
import { Settings } from '../generated-types'
import { getDefaultFieldsToMap, getDefaultFieldTypes, PROFILE_DEFAULT_FIELDS, ProfileFieldConfig } from '../profile-fields'

const standardFields = getDefaultFieldsToMap()

const audienceMapping = stringifyMappingSchemaForGraphQL([
  {
    incomingKey: 'audienceId',
    destinationKey: 'external_id',
    type: 'string',
    label: 'External Audience ID',
    isPii: false,
  },
  {
    incomingKey: 'audienceName',
    destinationKey: 'name',
    type: 'string',
    label: 'External Audience Name',
    isPii: false,

  }
])

interface Mapping {
  incomingKey: string
  destinationKey: string
  label: string
  type: string
  isPii: boolean  
  value?: string
}

export async function performForwardAudienceEvents(request: RequestClient, events: Payload[], settings: Settings) {
  if (events.length === 0) {
    return
  }
  const fieldsToMap: Set<string> = getDefaultFieldsToMap()
  const fieldTypes: Record<string, string> = getDefaultFieldTypes()
  const advertiserId = settings.advertiser_id
  
  const profileUpdates = events.map((event) => {
    const { segment_computation_key: audienceKey, segment_computation_id: audienceId, user_id, traits_or_props } = event

    const action = traits_or_props[audienceKey]
    const profile: Record<string, string | number | undefined> = {
      userId: user_id,
      audienceId,
      audienceName: audienceKey,
      action: action ? 'enter' : 'exit'
    }

   
    if (traits_or_props && !isEmpty(traits_or_props)) {
      // Extract audience key from traits_or_props and process the rest
      const { [audienceKey]: _, ...otherTraits } = traits_or_props
      
      const processedTraits = processTraits(otherTraits, fieldsToMap, fieldTypes)
      Object.assign(profile, processedTraits)
      
      // Process birthday after assignment to override any raw birthday value
      if (processedTraits.birth_date && typeof processedTraits.birth_date === 'string') {
        // Extract birth_day, birth_month, and birth_year from ISO date string
        const [birthYear, birthMonth, birthDay] = processedTraits.birth_date.split('T')[0].split('-')
        profile.birth_day = parseInt(birthDay)
        profile.birth_month = parseInt(birthMonth)
        profile.birth_year = parseInt(birthYear)
      }
    }

    return profile
  })

  const mappings = getProfileMappings(Array.from(fieldsToMap), fieldTypes, events[0].marketing_status as string)
  const profiles = stringifyJsonWithEscapedQuotes(profileUpdates)
  const mutation = `mutation {
      upsertProfiles(
        input: {
          advertiserId: ${advertiserId},
          externalProvider: "${EXTERNAL_PROVIDER}",
          syncId: "${sha256hash(profiles)}",
          profiles: "${profiles}"
        }
      ) {
        userErrors {
          message
        }
      }
      upsertProfileMapping(
        input: {
          advertiserId: ${advertiserId},
          mappingSchemaV2: ${mappings},
          mappableType: "${EXTERNAL_PROVIDER}"
        }
      ) {
        userErrors {
          message
        }
      }
      upsertExternalAudienceMapping(
        input: {
          advertiserId: ${advertiserId},
          mappingSchema: ${audienceMapping},
          mappableType: "${EXTERNAL_PROVIDER}"
        }
      ) {
        userErrors {
          message
        }
      }
    }`
  return await request(GQL_ENDPOINT, {
    body: JSON.stringify({ query: mutation })
  })

  function processTraits(traits: Record<string, unknown>, fieldsToMap: Set<string>, fieldTypes: Record<string, string>) {
    // Process trait keys (already in snake_case) and capture any non-standard fields as mappings
    return Object.keys(traits).reduce((acc: Record<string, unknown>, key) => {
      const value = traits[key]
      
      // Skip if key is empty string or value is empty string
      if (key === '' || value === '') {
        return acc
      }
      
      acc[key] = value
      if (!standardFields.has(key)) {
        fieldsToMap.add(key)
        // Field type should be the most specific type of the values we've seen so far, use string if there is a conflict of types
        if (value || value === 0) {
          const type = getType(value)
          if (fieldTypes[key] && fieldTypes[key] !== type) {
            fieldTypes[key] = 'STRING'
          } else {
            fieldTypes[key] = type
          }
        }
      }
      return acc
    }, {})
  }
}

function getProfileMappings(customFields: string[], fieldTypes: Record<string, string>, marketing_status: string) {
  const mappingSchema: Mapping[] = []
  for (const field of customFields) {
    // Keys are already in snake_case, so find directly in PROFILE_DEFAULT_FIELDS
    const fieldConfig = PROFILE_DEFAULT_FIELDS.find((f: ProfileFieldConfig) => f.key === field)
    
    if (fieldConfig) {
      // Special mapping cases for StackAdapt destination keys
      let destinationKey: string
      switch (fieldConfig.key) {
        case 'user_id':
          destinationKey = 'external_id'
          break
        default:
          destinationKey = fieldConfig.key
      }
      
      // StackAdapt uses destinationKey to look up global fields so it has to match 
      mappingSchema.push({
        incomingKey: field, // Use original snake_case field name as incomingKey
        destinationKey,
        label: fieldConfig.label,
        type: fieldConfig.type.toUpperCase(),
        isPii: fieldConfig.isPii || false
      })
    } else {
      // Fallback for custom fields not in default global fields
      mappingSchema.push({
        incomingKey: field,
        destinationKey: field,
        label: generateLabel(field),
        type: fieldTypes[field] ?? 'STRING',
        isPii: false
      })
    }
  }

  if (marketing_status) {
    mappingSchema.push({
      incomingKey: 'marketing_status',
      destinationKey: 'marketing_status',
      label: 'Marketing Status',
      type: 'STRING',
      isPii: false,
      value: marketing_status,
    })
  }
  return stringifyMappingSchemaForGraphQL(mappingSchema)
}

function generateLabel(field: string) {
  // Convert snake_case to "Title Case"
  let label = field
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (str) => str.toUpperCase())

  // Check if the input starts with "audience" and attach "External" if true
  if (field.startsWith('audience')) {
    label = `External ${label}`
  }

  return label
}

function getType(value: unknown) {
  if (isDateStr(value)) return 'DATE'
  return (typeof value).toUpperCase()
}

function isDateStr(value: unknown) {
  if (typeof value !== 'string') return false
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    /^\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}/ // MM-DD-YYYY
  ]
  
  const hasDatePattern = datePatterns.some(pattern => pattern.test(value))
  if (!hasDatePattern) return false
  
  const parsed = Date.parse(value)
  return !isNaN(parsed)
}
