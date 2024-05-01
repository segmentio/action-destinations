import type { ActionDefinition, DynamicFieldResponse, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { formatSubscribeProfile, formatSubscribeRequestBody } from '../functions'
import { SubscribeProfile } from '../types'
import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe Klaviyo profiles to Email marketing, SMS marketing, or both.',
  defaultSubscription: 'type = "track" and event = "User Subscribed"',
  fields: {
    email: {
      label: 'Email',
      description: `The email address to subscribe. If provided, the associated profile will be subscribed to Email marketing.`,
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
      description: `The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be subscribed to SMS marketing.`,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      }
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.`,
      type: 'string',
      dynamic: true
    },
    custom_source: {
      label: 'Custom Source ($source)',
      description:
        'A custom method or source to detail source of consent preferences (e.g., "Marketing Event"). The default is set to -59, as this is [the $source value associated with Segment](https://help.klaviyo.com/hc/en-us/articles/1260804673530#h_01HDKHG9AM4BSSM009BM6XBF1H).',
      type: 'string',
      default: '-59'
    },
    consented_at: {
      label: 'Consented At',
      description: `The timestamp of when the profile's consent was gathered.`,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description: 'When enabled, the action will use the Klaviyo batch API.'
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, phone_number, consented_at, list_id, custom_source } = payload
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const profileToSubscribe = formatSubscribeProfile(email, phone_number, consented_at)
    const subData = formatSubscribeRequestBody(profileToSubscribe, list_id, custom_source)

    // subscribe requires use of 2024-02-15 api version
    return await request(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
      method: 'POST',
      headers: {
        revision: '2024-02-15'
      },
      json: subData
    })
  },
  performBatch: async (request, { payload }) => {
    // remove payloads that have niether email or phone_number
    const filteredPayload = payload.filter((profile) => profile.email || profile.phone_number)

    // if there are no payloads with phone or email throw error
    if (filteredPayload.length === 0) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const sortedProfilesObject = sortBatches(filteredPayload)
    /*  sort profiles into batches with same list_id and custom_source pairing:

      batches: {
        '1234abcd' {
          list_id: '1234',
          custom_source: 'abcd',
          profiles: [...]
        },
        ...
      }

    */

    // throw error if too many batches
    const batches = Object.keys(sortedProfilesObject)
    if (batches.length > 9) {
      throw new PayloadValidationError(
        'Exceeded maximum allowed batches due to unique list_id and custom_source pairings'
      )
    }
    const requests: Promise<ModifiedResponse<Response>>[] = []
    batches.forEach((key) => {
      const { list_id, custom_source, profiles } = sortedProfilesObject[key]

      // max number of profiles is 100 per request
      for (let i = 0; i < profiles.length; i += 100) {
        const profilesSubset = profiles.slice(i, i + 100)
        const subData = formatSubscribeRequestBody(profilesSubset, list_id, custom_source)

        const response = request<Response>(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
          method: 'POST',
          headers: {
            revision: '2024-02-15'
          },
          json: subData
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
    custom_source?: string
    profiles: SubscribeProfile[]
  }
}

function sortBatches(batchPayload: Payload[]) {
  const output: SortedBatches = {}

  batchPayload.forEach((payload) => {
    const { email, phone_number, custom_source, consented_at, list_id } = payload

    const listId = list_id || 'noListId'
    const customSource = custom_source || 'noCustomSource'

    // combine list_id and custom_source to get unique key for batch
    const key = `${listId}${customSource}`

    // if a batch with this key does not exist, create it
    if (!output[key]) {
      const batch: { list_id?: string; custom_source?: string; profiles: SubscribeProfile[] } = {
        profiles: []
      }

      if (list_id !== undefined) {
        batch.list_id = list_id
      }

      if (custom_source !== undefined) {
        batch.custom_source = custom_source
      }

      output[key] = batch
    }

    // format profile data klaviyo api spec
    const profileToSubscribe = formatSubscribeProfile(email, phone_number, consented_at)

    // add profile to batch
    output[key].profiles.push(profileToSubscribe)
  })

  return output
}
