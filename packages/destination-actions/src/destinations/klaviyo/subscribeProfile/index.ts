import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { API_URL } from '../config'
import { SubscribeProfile, SubscribeEventData } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe Klaviyo profiles to Email marketing, SMS marketing, or both.',
  fields: {
    klaviyo_id: {
      label: 'Klaviyo Id',
      description: `The Unique ID or External ID of the profile in Klaviyo. If provided, this will be used to perform the profile lookup. One of email or phone number is still required.`,
      type: 'string'
    },
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
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: async (request, { payload }) => {
    const { email, klaviyo_id, phone_number, consented_at, list_id, custom_source } = payload
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const profileToSubscribe = formatSubscribeProfile(email, phone_number, klaviyo_id, consented_at)

    const eventData: SubscribeEventData = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: custom_source || 'Segment Klaviyo (Actions) Destination', // Use custom_source if populated, otherwise fallback to default value
          profiles: {
            data: [profileToSubscribe]
          }
        }
      }
    }

    if (list_id) {
      eventData.data.relationships = {
        list: {
          data: {
            type: 'list',
            id: list_id
          }
        }
      }
    }

    // subscribe requires use of 2024-02-15 api version
    return await request(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
      method: 'POST',
      headers: {
        revision: '2024-02-15'
      },
      json: eventData
    })
  }
}

function formatSubscribeProfile(
  email: string | undefined,
  phone_number: string | undefined,
  klaviyo_id: string | undefined,
  consented_at: string | number | undefined
) {
  const profileToSubscribe: SubscribeProfile = {
    type: 'profile',
    attributes: {
      id: klaviyo_id || undefined,
      email,
      phone_number,
      subscriptions: {}
    }
  }

  if (email) {
    profileToSubscribe.attributes.subscriptions.email = {
      marketing: {
        consent: 'SUBSCRIBED',
        consented_at: consented_at
      }
    }
  }

  if (phone_number) {
    profileToSubscribe.attributes.subscriptions.sms = {
      marketing: {
        consent: 'SUBSCRIBED',
        consented_at: consented_at
      }
    }
  }
  return profileToSubscribe
}

export default action
