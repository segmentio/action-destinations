import { RequestClient } from '@segment/actions-core'
import camelCase from 'lodash/camelCase'
import isEmpty from 'lodash/isEmpty'
import { Payload } from './generated-types'
import { GQL_ENDPOINT, EXTERNAL_PROVIDER, sha256hash, stringifyJsonWithEscapedQuotes } from '../functions'

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

interface Mapping {
  incomingKey: string
  destinationKey: string
  label: string
  type: string
  isPii: boolean
}

export async function performForwardProfiles(request: RequestClient, events: Payload[]) {
  const fieldsToMap: Set<string> = new Set(['userId'])
  const fieldTypes: Record<string, string> = { userId: 'string' }
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
          mappableType: "${EXTERNAL_PROVIDER}",
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
      incomingKey: field,
      destinationKey: field === 'userId' ? 'external_id' : field,
      label: generateLabel(field),
      type: fieldTypes[field] ?? 'string',
      isPii: false
    })
  }
  return stringifyJsonWithEscapedQuotes(mappingSchema)
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
  if (isDateStr(value)) return 'date'
  return typeof value
}

function isDateStr(value: unknown) {
  return typeof value === 'string' && !isNaN(Date.parse(value))
}
