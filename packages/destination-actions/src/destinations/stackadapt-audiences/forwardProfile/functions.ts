import { RequestClient } from '@segment/actions-core'
import camelCase from 'lodash/camelCase'
import isEmpty from 'lodash/isEmpty'
import { Payload } from './generated-types'
import { domain } from '..'
import { createHash } from 'crypto'

const EXTERNAL_PROVIDER = 'segmentio'

const standardFields = new Set([
  'email',
  'firstName',
  'lastName',
  'phone',
  'marketingStatus',
  'company',
  'gender',
  'city',
  'state',
  'country',
  'timezone',
  'postalCode',
  'birthDay',
  'birthMonth',
  'address',
  'previousId'
])
const audienceMapping = stringifyJsonWithEscapedQuotes([
  {
    incoming_key: 'audienceId',
    destination_key: 'external_id',
    data_type: 'string'
  },
  {
    incoming_key: 'audienceName',
    destination_key: 'name',
    data_type: 'string'
  }
])

interface Mapping {
  incoming_key: string
  destination_key: string
  data_type: string
  is_pii: boolean
}

export async function performForwardProfiles(request: RequestClient, events: Payload[]) {
  const fieldsToMap: Set<string> = new Set(['userId'])
  const fieldTypes: Record<string, string> = { userId: 'string' }
  const advertiserId = events[0].advertiser_id
  const profileUpdates = events.flatMap((event) => {
    const {
      segment_computation_key,
      segment_computation_class,
      segment_computation_id,
      event_type,
      previous_id,
      user_id,
      traits_or_props
    } = event

    const isAudienceEvent = segment_computation_class === 'audience'
    const audienceKey = (traits_or_props.audience_key as string) ?? segment_computation_key
    const { audience_key, [audienceKey]: action, ...traits } = traits_or_props
    const profile: Record<string, string | number | undefined> = {
      userId: user_id
    }
    if (event_type === 'alias') {
      profile.previousId = previous_id
    } else if (isAudienceEvent) {
      profile.audienceId = segment_computation_id
      profile.audienceName = audienceKey
      profile.action = action ? 'enter' : 'exit'
    } else if (isEmpty(traits)) {
      // Skip if there are no traits and this is not an audience event
      return []
    }
    return { ...processTraits(traits), ...profile }
  })

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
          mappingSchema: "${getProfileMappings(Array.from(fieldsToMap), fieldTypes)}",
          mappableType: "${EXTERNAL_PROVIDER}",
        }
      ) {
        userErrors {
          message
        }
      }
      upsertExternalAudienceMapping(
        input: {
          advertiserId: ${advertiserId},
          mappingSchema: "${audienceMapping}",
          mappableType: "${EXTERNAL_PROVIDER}"
        }
      ) {
        userErrors {
          message
        }
      }
    }`
  return await request(domain, {
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
            fieldTypes[camelCaseKey] = 'string'
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
    mappingSchema.push({
      incoming_key: field,
      destination_key: field === 'userId' ? 'external_id' : field,
      data_type: fieldTypes[field] ?? 'string',
      is_pii: false
    })
  }
  return stringifyJsonWithEscapedQuotes(mappingSchema)
}

function stringifyJsonWithEscapedQuotes(value: unknown) {
  return JSON.stringify(value).replace(/"/g, '\\"')
}

function sha256hash(data: string) {
  const hash = createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

function getType(value: unknown) {
  if (isDateStr(value)) return 'date'
  return typeof value
}

function isDateStr(value: unknown) {
  return typeof value === 'string' && !isNaN(Date.parse(value))
}
