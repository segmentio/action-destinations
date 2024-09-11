import { RequestClient } from '@segment/actions-core'
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
  if (events.length === 0) return
  const fieldsToMap: Set<string> = new Set(['userId'])
  const fieldTypes: Record<string, string> = { userId: 'string' }
  const advertiserId = events[0].advertiser_id
  const profileUpdates = events.flatMap((event) => {
    const profile: Record<string, string | number | undefined> = {
      userId: event.user_id
    }
    if (event.event_type === 'track' && event.segment_computation_class !== 'audience') {
      // Filter out track events that are not audience enter/exit events until we have support for event tracking on our side
      return []
    } else if (event.event_type === 'alias') {
      profile.previousId = event.previous_id
    } else if (
      event.segment_computation_class === 'audience' &&
      event.traits_or_props &&
      event.segment_computation_key
    ) {
      // If this is an audience enter/exit event, there should be a boolean flag in the traits or props indicating if the user entered or exited the audience
      // We need to translate it into an enter or exit action as expected by the profile upsert GraphQL mutation
      if (event.event_type === 'track') console.log(event.traits_or_props)
      profile.audienceId = event.segment_computation_id
      const audienceKey = (event.traits_or_props.audience_key as string) ?? event.segment_computation_key
      profile.audienceName = audienceKey
      profile.action = event.traits_or_props[audienceKey] ? 'enter' : 'exit'
      delete event.traits_or_props.audience_key
      delete event.traits_or_props[audienceKey] // Don't need to include the boolean flag in the GQL payload
    }
    // Convert trait keys to camelCase and capture any non-standard fields
    const traits = Object.keys(event?.traits_or_props ?? {}).reduce((acc: Record<string, unknown>, key) => {
      const camelCaseKey = toCamelCase(key)
      acc[camelCaseKey] = event?.traits_or_props?.[key]
      if (!standardFields.has(camelCaseKey)) {
        fieldsToMap.add(camelCaseKey)
        // Field type should be the most specific type of the values we've seen so far, use string if there is a conflict of types
        if (event?.traits_or_props?.[key] || event?.traits_or_props?.[key] === 0) {
          const type = getType(event.traits_or_props[key])
          if (fieldTypes[camelCaseKey] && fieldTypes[camelCaseKey] !== type) {
            fieldTypes[camelCaseKey] = 'string'
          } else {
            fieldTypes[camelCaseKey] = type
          }
        }
      }
      return acc
    }, {})
    return { ...traits, ...profile }
  })

  const profiles = stringifyJsonWithEscapedQuotes(profileUpdates)
  const mutation = `mutation {
      upsertProfiles(
        advertiserId: ${advertiserId},
        externalProvider: "${EXTERNAL_PROVIDER}",
        syncId: "${sha256hash(profiles)}",
        profiles: "${profiles}"
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
  if (value instanceof Date) return 'date'
  return typeof value
}

// From https://www.30secondsofcode.org/js/s/string-case-conversion/
function toCamelCase(str: string) {
  const s = str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join('')
  return s ? s.slice(0, 1).toLowerCase() + s.slice(1) : ''
}
