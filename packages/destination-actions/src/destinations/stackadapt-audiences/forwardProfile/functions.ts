import { RequestClient } from '@segment/actions-core'
import camelCase from 'lodash/camelCase'
import isEmpty from 'lodash/isEmpty'
import { Payload } from './generated-types'
import { GQL_ENDPOINT, EXTERNAL_PROVIDER, sha256hash, stringifyJsonWithEscapedQuotes, stringifyMappingSchemaForGraphQL } from '../functions'
import { getFieldsToMap, getFieldTypes, PROFILE_DEFAULT_FIELDS } from '../profile-fields'

const standardFields = getFieldsToMap()

interface Mapping {
  incomingKey: string
  destinationKey: string
  label: string
  type: string
  isPii: boolean
}

export async function performForwardProfiles(request: RequestClient, events: Payload[]) {
  const fieldsToMap: Set<string> = getFieldsToMap()
  const fieldTypes: Record<string, string> = getFieldTypes()
  const advertiserId = events[0].advertiser_id
  const profileUpdates = events.flatMap((event) => {
    const { event_type, previous_id, user_id, traits } = event
    const profile: Record<string, string | number | undefined> = {
      userId: user_id
    }
    if (event_type === 'alias') {
      profile.previousId = previous_id
    } else if (isEmpty(traits)) {
      // Skip if there are no traits
      return []
    }
    const { birthday, ...rest } = traits ?? {}
    if (birthday) {
      // Extract birthDay and birthMonth from ISO date string
      const [birthDay, birthMonth] = birthday.split('T')[0].split('-').slice(1)
      profile.birthDay = parseInt(birthDay)
      profile.birthMonth = parseInt(birthMonth)
    }
    return { ...processTraits(rest), ...profile }
  })

  if (profileUpdates.length === 0) {
    return
  }
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
          mappingSchemaV2: ${getProfileMappings(Array.from(fieldsToMap), fieldTypes)},
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

  function processTraits(traits: Record<string, unknown>) {
    // Convert trait keys to camelCase and capture any non-standard fields as mappings
    return Object.keys(traits).reduce((acc: Record<string, unknown>, key) => {
      const camelCaseKey = camelCase(key)
      acc[camelCaseKey] = traits[key]
      if (!standardFields.has(camelCaseKey)) {
        fieldsToMap.add(camelCaseKey)
        // Field type should be the most specific type of the values we've seen so far, use string if there is a conflict of types
        if (traits[key] || traits[key] === 0) {
          const type = getType(traits[key])
          if (fieldTypes[camelCaseKey] && fieldTypes[camelCaseKey] !== type) {
            fieldTypes[camelCaseKey] = 'STRING'
          } else {
            fieldTypes[camelCaseKey] = type
          }
        }
      }
      return acc
    }, {})
  }
}

function getProfileMappings(customFields: string[], fieldTypes: Record<string, string>) {
  const mappingSchema: Mapping[] = []
  for (const field of customFields) {
    // Find the field config in PROFILE_DEFAULT_FIELDS
    const fieldConfig = PROFILE_DEFAULT_FIELDS.find(f => f.key === field)
    
    if (fieldConfig) {
      // Convert camelCase to snake_case for destinationKey
      const snakeCaseKey = fieldConfig.key.replace(/([A-Z])/g, '_$1').toLowerCase()
      
      // Special mapping cases for StackAdapt destination keys
      let destinationKey: string
      switch (fieldConfig.key) {
        case 'userId':
          destinationKey = 'external_id'
          break
        case 'birthday':
          destinationKey = 'birth_date'
          break
        default:
          destinationKey = snakeCaseKey
      }
      
      // StackAdapt uses destinationKey to look up global fields so it has to match 
      mappingSchema.push({
        incomingKey: fieldConfig.key,
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
  return stringifyMappingSchemaForGraphQL(mappingSchema)
}

function generateLabel(field: string) {
  // Convert camelCase to "Title Case"
  let label = field
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (str) => str.toUpperCase())

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
  return typeof value === 'string' && !isNaN(Date.parse(value))
}
