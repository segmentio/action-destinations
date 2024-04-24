import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { subscribeProfiles, formatSubscribeProfile } from '../functions'
import { SubscribeProfile, SubscribeEventData } from '../types'
import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe Klaviyo profiles to Email marketing, SMS marketing, or both.',
  fields: {
    email: {
      label: 'Email',
      description: `The email address to subscribe. If provided, the associated profile will be subscribed to Email marketing.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$.context.traits.email' }
    },
    phone_number: {
      label: 'Phone Number',
      description: `The phone number to subscribe. This must be in E.164 format. If provided, the associated profile will be subscribed to SMS marketing.`,
      type: 'string',
      default: { '@path': '$.context.traits.phone' }
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.`,
      type: 'string',
      dynamic: true
    },
    custom_source: {
      label: 'Custom Source',
      description: 'A custom method or source to detail source of consent preferences (e.g., "Marketing Event").',
      type: 'string',
      default: 'Segment Klaviyo (Actions) Destination'
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
      description:
        'When enabled, the action will use the klaviyo batch API. Fields "List Id" and "Custom Source" will need to be static values when batching is enabled.'
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
    await subscribeProfiles(profileToSubscribe, custom_source, list_id, request)
  },
  performBatch: async (request, { payload }) => {
    // remove payloads that have niether email or phone_number
    const filteredPayload = payload.filter((profile) => profile.email || profile.phone_number)

    // if there are no payloads with phone or email throw error
    if (filteredPayload.length === 0) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    // sort profiles into batches with same list_id and custom_source pairing
    const sortedProfilesObject = sortListIdAndCustomSource(filteredPayload)
    const batches = Object.keys(sortedProfilesObject)

    // throw error if too many batches
    if (batches.length > 9) {
      throw new PayloadValidationError(
        'Exceeded maximum allowed batches due to unique list_id and custom_source pairings'
      )
    }
    const requests = []
    batches.forEach((key) => {
      const { list_id, custom_source, data } = sortedProfilesObject[key]

      const subData: SubscribeEventData = {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: data
            }
          }
        }
      }
      if (custom_source) {
        subData.data.attributes.custom_source = custom_source
      }
      if (list_id) {
        subData.data.relationships = {
          list: {
            data: {
              type: 'list',
              id: list_id
            }
          }
        }
      }

      const response = request(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
        method: 'POST',
        headers: {
          revision: '2024-02-15'
        },
        json: subData
      })

      requests.push(response)
    })
    return Promise.all(requests)
  }
}

export default action

interface SortedBatches {
  [key: string]: {
    list_id?: string
    custom_source?: string
    data: SubscribeProfile[]
  }
}

function sortListIdAndCustomSource(batchPayload: Payload[]) {
  const output: SortedBatches = {}

  batchPayload.forEach((payload) => {
    const { email, phone_number, custom_source, consented_at, list_id } = payload

    const listId = list_id || 'noListId'
    const customSource = custom_source || 'noCustomSource'

    // combine list_id and custom_source to get unique key for batch
    const key = `${listId}${customSource}`

    if (!output[key]) {
      const outputItem: { list_id?: string; custom_source?: string; data: SubscribeProfile[] } = {
        data: []
      }

      if (list_id !== undefined) {
        outputItem.list_id = list_id
      }

      if (custom_source !== undefined) {
        outputItem.custom_source = custom_source
      }

      output[key] = outputItem
    }

    // format profile data in each batch
    const profileToSubscribe: SubscribeProfile = {
      type: 'profile',
      attributes: {
        subscriptions: {}
      }
    }
    if (email) {
      profileToSubscribe.attributes.email = email
      profileToSubscribe.attributes.subscriptions.email = {
        marketing: {
          consent: 'SUBSCRIBED',
          consented_at: consented_at
        }
      }
    }
    if (phone_number) {
      profileToSubscribe.attributes.phone_number = phone_number
      profileToSubscribe.attributes.subscriptions.sms = {
        marketing: {
          consent: 'SUBSCRIBED',
          consented_at: consented_at
        }
      }
    }
    output[key].data.push(profileToSubscribe)
  })

  return output
}
