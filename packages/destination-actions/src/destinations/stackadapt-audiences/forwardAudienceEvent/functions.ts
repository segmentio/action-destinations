import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { PROFILE_DEFAULT_FIELDS, MAPPING_SCHEMA, MarketingStatus as MarketingStatuses } from './constants'
import { GQL_ENDPOINT, EXTERNAL_PROVIDER } from '../common-constants'
import { Mapping, MarketingStatus, ProfileFieldConfig, RawMapping } from './types'
import type { Payload } from './generated-types'
import { sha256hash } from '../common-functions'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings, rawMapping: RawMapping) {
  const reservedKeys = [payloads[0]?.segment_computation_key, payloads[0]?.segment_computation_id].filter(
    (key): key is string => Boolean(key)
  )

  const fieldTypes = getConfiguredFieldTypes(rawMapping, reservedKeys)
  const fieldsToMap = getConfiguredFieldsToMap(rawMapping, reservedKeys)
  const advertiserId = settings.advertiser_id
  const marketingStatus = payloads[0].marketing_status as MarketingStatus

  const profileUpdates = payloads.map((p) => {
    const { user_id, standard_traits, custom_traits, email } = p

    const { segment_computation_key, segment_computation_id, traits_or_props } = p

    if (custom_traits) {
      // Remove reserved keys from custom traits just incase the customer accidentally maps them
      delete custom_traits[segment_computation_key]
      delete custom_traits[segment_computation_id]
    }

    const profile: Record<string, string | number | undefined> = {
      userId: user_id,
      email,
      ...standard_traits,
      ...custom_traits
    }

    profile.audienceId = segment_computation_id
    profile.audienceName = segment_computation_key
    profile.action = traits_or_props[segment_computation_key] ? 'enter' : 'exit'

    return profile
  })

  const mappings = getProfileMappings(Array.from(fieldsToMap), fieldTypes)
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
          isOptedIn: ${marketingStatus === MarketingStatuses.OPT_IN},
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

function audienceMutation(advertiserId: string, audienceMapping: string): string {
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
        }`
}

/** Build profile field keys from destination mapping config, not per-batch payload values. */
export function getConfiguredFieldsToMap(rawMapping: RawMapping, reservedKeys: string[] = []): Set<string> {
  const fieldsToMap = getDefaultFieldsToMap()
  const customTraitsMapping = rawMapping.custom_traits

  if (customTraitsMapping && typeof customTraitsMapping === 'object') {
    for (const key of Object.keys(customTraitsMapping)) {
      if (!key || reservedKeys.includes(key) || fieldsToMap.has(key)) {
        continue
      }
      fieldsToMap.add(key)
    }
  }

  return fieldsToMap
}

export function getConfiguredFieldTypes(rawMapping: RawMapping, reservedKeys: string[] = []): Record<string, string> {
  const fieldTypes = getDefaultFieldTypes()
  const configuredCustomKeys = getConfiguredFieldsToMap(rawMapping, reservedKeys)

  for (const key of configuredCustomKeys) {
    if (!fieldTypes[key]) {
      fieldTypes[key] = 'STRING'
    }
  }

  return fieldTypes
}

function getProfileMappings(customFields: string[], fieldTypes: Record<string, string>) {
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

// transform an array of mapping objects into a string which can be sent as parameter in a GQL request
export function stringifyJsonWithEscapedQuotes(value: unknown) {
  const jsonString = JSON.stringify(value)

  // Finally escape all remaining quotes
  return jsonString.replace(/"/g, '\\"')
}

// transform mapping schema for direct insertion into GraphQL queries (no quote escaping)
export function stringifyMappingSchemaForGraphQL(value: unknown) {
  let jsonString = JSON.stringify(value)

  // Replace "type":"VALUE" with type:VALUE (unquoted enum and field)
  jsonString = jsonString.replace(/"type":"([^"]+)"/g, (_, typeValue: string) => `type:${typeValue.toUpperCase()}`)

  // Remove quotes from all object keys to make it valid GraphQL syntax
  jsonString = jsonString.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g, '$1:')

  return jsonString
}

const getDefaultFieldsToMap = (): Set<string> => {
  return new Set(PROFILE_DEFAULT_FIELDS.map((field) => field.key))
}

const getDefaultFieldTypes = (): Record<string, string> => {
  return PROFILE_DEFAULT_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.type.toUpperCase()
    return acc
  }, {} as Record<string, string>)
}
