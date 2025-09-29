import { RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import {GQL_ENDPOINT, EXTERNAL_PROVIDER, PROFILE_DEFAULT_FIELDS, MAPPING_SCHEMA } from './constants'
import {  Mapping, MarketingStatus, ProfileFieldConfig } from './types'
import type { Payload as AudiencePayload } from './forwardAudienceEvent/generated-types'
import type { Payload as RegularPayload } from './forwardProfile/generated-types'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

export async function send(request: RequestClient, payloads: RegularPayload[] | AudiencePayload[], settings: Settings) {

  const fieldTypes = getDefaultFieldTypes()
  const fieldsToMap = getDefaultFieldsToMap()
  const advertiserId = settings.advertiser_id
  const marketingStatus = isBatchAudience(payloads) ? (payloads[0] as AudiencePayload).marketing_status as MarketingStatus : undefined
  
  const profileUpdates = payloads.map((p) => {
    
    const isAudience = isAudiencePayload(p)
    
    const {
      user_id,
      standard_traits: {
        birth_date,
        birth_day,
        birth_month,
        birth_year,
        ...restStandardTraits
      } = {},
      custom_traits
    } = p

    let segment_computation_key: string | undefined
    let segment_computation_id: string | undefined
    let traits_or_props: AudiencePayload['traits_or_props'] | undefined

    if(isAudience) {
      ({ 
        segment_computation_key, 
        segment_computation_id, 
        traits_or_props 
      } = p)

      if(custom_traits) {
        // Remove reserved keys from custom traits just incase the customer accidentally maps them
        delete custom_traits[segment_computation_key] 
        delete custom_traits[segment_computation_id] 
      }
    }

    let date: Date | undefined
    if(birth_date){
      date = new Date(birth_date)
    }

    const profile: Record<string, string | number | undefined> = {
      userId: user_id,
      ...restStandardTraits,
      birth_day: (date ? date.getDate() : birth_day) ?? undefined,
      birth_month: (date ? date.getMonth() + 1 : birth_month) ?? undefined,
      birth_year: (date ? date.getFullYear() : birth_year) ?? undefined,
      ...custom_traits
    }

    if(isAudience && traits_or_props && segment_computation_key && segment_computation_id) {
      profile.segment_computation_id = segment_computation_id
      profile.segment_computation_key = segment_computation_key
      profile.action = traits_or_props[segment_computation_key] ? 'enter' : 'exit'
    }

    if(!isAudience && p.previous_id){
      profile.previous_id = p.previous_id
    }

    updateFieldsToMapAndFieldTypes(fieldsToMap, fieldTypes, custom_traits)

    return profile
  })

  const mappings = getProfileMappings(Array.from(fieldsToMap), fieldTypes, marketingStatus)
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
      ${audienceMutation(advertiserId, stringifyMappingSchemaForGraphQL(MAPPING_SCHEMA))}
  }`

  return await request(GQL_ENDPOINT, {
    body: JSON.stringify({ query: mutation })
  })
}

export function sha256hash(data: string) {
  const hash = createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

function audienceMutation(advertiserId: string | undefined, audienceMapping: string | undefined): string | undefined {
  if(advertiserId && audienceMapping){
    return `upsertExternalAudienceMapping(
            input: {
              advertiserId: ${advertiserId},
              mappingSchema: ${audienceMapping},
              mappableType: "${EXTERNAL_PROVIDER}"
            }
          ) {
            userErrors {
              message
            }
          }`;
  } else {
    return ''
  }
}

function isAudiencePayload(payload: RegularPayload | AudiencePayload): payload is AudiencePayload {
  return 'segment_computation_id' in payload && typeof payload.segment_computation_id === 'string' &&
         'segment_computation_key' in payload && typeof payload.segment_computation_key === 'string' &&
         'traits_or_props' in payload && typeof payload.traits_or_props === 'object'
}

function isBatchAudience(payloads: RegularPayload[] | AudiencePayload[]): boolean {
  return payloads.every(isAudiencePayload)
} 

function updateFieldsToMapAndFieldTypes(fieldsToMap: Set<string>, fieldTypes: Record<string, string>, customTraits: RegularPayload['custom_traits'] | AudiencePayload['custom_traits'] = {}) {
   // Process trait keys (already in snake_case) and capture any non-standard fields as mappings 
  return Object.keys(customTraits).reduce((acc: Record<string, unknown>, key) => {
    const value = customTraits[key]
    
    // Skip if key is empty string or value is empty string
    if (key === '' || value === '') {
      return acc
    }
    
    acc[key] = value
    
    const standardFields = getDefaultFieldsToMap()

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

function getProfileMappings(customFields: string[], fieldTypes: Record<string, string>, marketingStatus?: MarketingStatus) {
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

  if(typeof marketingStatus === 'string') {
    mappingSchema.push({
      incomingKey: 'marketing_status',
      destinationKey: 'marketing_status',
      label: 'Marketing Status',
      type: 'STRING',
      isPii: false,
      value: marketingStatus,
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

// transform an array of mapping objects into a string which can be sent as parameter in a GQL request
export function stringifyJsonWithEscapedQuotes(value: unknown) {
  const jsonString = JSON.stringify(value);
  
  // Finally escape all remaining quotes
  return jsonString.replace(/"/g, '\\"');
}

// transform mapping schema for direct insertion into GraphQL queries (no quote escaping)
export function stringifyMappingSchemaForGraphQL(value: unknown) {
  let jsonString = JSON.stringify(value)
  
  // Replace "type":"VALUE" with type:VALUE (unquoted enum and field)
  jsonString = jsonString.replace(/"type":"([^"]+)"/g, (_, typeValue: string) => 
    `type:${typeValue.toUpperCase()}`)
  
  // Remove quotes from all object keys to make it valid GraphQL syntax
  jsonString = jsonString.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:');
  
  return jsonString
}

const getDefaultFieldsToMap = (): Set<string> => {
  return new Set(PROFILE_DEFAULT_FIELDS.map(field => field.key))
}

const getDefaultFieldTypes = (): Record<string, string> => {
  return PROFILE_DEFAULT_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.type.toUpperCase()
    return acc
  }, {} as Record<string, string>)
}
