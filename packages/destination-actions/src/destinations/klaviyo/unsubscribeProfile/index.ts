import type { ActionDefinition, DynamicFieldResponse, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData, processPhoneNumber, validateAndConvertPhoneNumber } from '../functions'
import { PayloadValidationError } from '@segment/actions-core'
import { formatUnsubscribeProfile, formatUnsubscribeRequestBody } from '../functions'
import { UnsubscribeProfile } from '../types'
import { API_URL } from '../config'
import { country_code } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Unsubscribe Profile',
  defaultSubscription: 'type = "track" and event = "User Unsubscribed"',
  description: 'Unsubscribe Klaviyo profiles from Email marketing, SMS marketing, or both.',
  fields: {
    email: {
      label: 'Email',
      description: `The email address to unsubscribe. If provided, the associated profile will be unsubscribed to Email marketing.`,
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    phone_number: {
      label: 'Phone Number',
      description: `The phone number to unsubscribe. This must be in E.164 format. If provided, the associated profile will be unsubscribed to SMS marketing.`,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    country_code: {
      ...country_code
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to remove the subscribed profiles from. If no list id is provided, the profile will be unsubscribed from all channels.`,
      type: 'string',
      dynamic: true
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description: 'When enabled, the action will use the Klaviyo batch API.'
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['list_id']
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, phone_number: initialPhoneNumber, list_id, country_code } = payload

    const phone_number = processPhoneNumber(initialPhoneNumber, country_code)
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const profileToUnSubscribe = formatUnsubscribeProfile(email, phone_number)
    const unSubData = formatUnsubscribeRequestBody(profileToUnSubscribe, list_id)

    return await request(`${API_URL}/profile-subscription-bulk-delete-jobs`, {
      method: 'POST',
      json: unSubData
    })
  },
  performBatch: async (request, { payload, statsContext }) => {
    // remove payloads that have niether email or phone_number
    const filteredPayload = payload.filter((profile) => {
      // Validate and convert the phone number using the provided country code
      const validPhoneNumber = validateAndConvertPhoneNumber(profile.phone_number, profile.country_code)

      // If the phone number is valid, update the profile's phone number with the validated format
      if (validPhoneNumber) {
        profile.phone_number = validPhoneNumber
      }
      // If the phone number is invalid (null), exclude this profile
      else if (validPhoneNumber === null) {
        return false
      }
      return profile.email || profile.phone_number
    })

    if (statsContext) {
      const { statsClient, tags } = statsContext
      const set = new Set()
      filteredPayload.forEach((profile) => {
        set.add(profile.list_id)
      })
      statsClient?.histogram('actions-klaviyo.unsubscribe_profile.unique_list_id', set.size, tags)
    }

    // if there are no payloads with phone or email throw error
    if (payload.length === 0) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const sortedProfilesObject = sortBatches(filteredPayload)
    /*  sort profiles into batches with same list_id:

      batches: {
        '1234' {
          list_id: '1234',
          profiles: [...]
        },
        ...
      }

    */

    // throw error if too many batches
    const batches = Object.keys(sortedProfilesObject)
    if (batches.length > 9) {
      throw new PayloadValidationError('Exceeded maximum allowed batches due to too many unique list_ids')
    }
    const requests: Promise<ModifiedResponse<Response>>[] = []
    batches.forEach((key) => {
      const { list_id, profiles } = sortedProfilesObject[key]

      // max number of profiles is 100 per request
      for (let i = 0; i < profiles.length; i += 100) {
        const profilesSubset = profiles.slice(i, i + 100)
        const unSubData = formatUnsubscribeRequestBody(profilesSubset, list_id)

        const response = request<Response>(`${API_URL}/profile-subscription-bulk-delete-jobs`, {
          method: 'POST',
          json: unSubData
        })

        requests.push(response)
      }
    })
    return await Promise.all(requests)
  }
}

export default action

interface SortedBatches {
  [key: string]: {
    list_id?: string
    profiles: UnsubscribeProfile[]
  }
}

function sortBatches(batchPayload: Payload[]) {
  const output: SortedBatches = {}

  batchPayload.forEach((payload) => {
    const { email, phone_number, list_id } = payload

    const key = list_id || 'noListId'

    // if a batch with this key does not exist, create it
    if (!output[key]) {
      const batch: { list_id?: string; profiles: UnsubscribeProfile[] } = {
        profiles: []
      }

      if (list_id !== undefined) {
        batch.list_id = list_id
      }

      output[key] = batch
    }

    // format profile data klaviyo api spec
    const profileToUnSubscribe = formatUnsubscribeProfile(email, phone_number)

    // add profile to batch
    output[key].profiles.push(profileToUnSubscribe)
  })

  return output
}
