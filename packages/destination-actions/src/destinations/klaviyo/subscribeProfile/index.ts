import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { API_URL } from '../config'
import { SubscribeProfile } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe a user in Klaviyo',
  defaultSubscription: 'type = "track"',
  fields: {
    klaviyo_id: {
      label: 'Klaviyo Id',
      description: `The Id of the profile to subscribe. If provided, this will be used to perform the profile lookup.`,
      type: 'string'
    },
    email: {
      label: 'Email',
      description: `Individual's email address. One of ID, Phone Number or Email required.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$context.traits.email' }
    },
    phone_number: {
      label: 'Phone Number',
      description: `Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.`,
      type: 'string',
      default: { '@path': '$context.traits.phone' }
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.`,
      type: 'string',
      dynamic: true
    },
    consented_at: {
      label: 'Consented At',
      description: `The timestamp of when the profile's consent was gathered.
      `,
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
    const { email, klaviyo_id, phone_number, consented_at } = payload

    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    const profileToSubscribe = formatSubscribeProfile(email, phone_number, klaviyo_id, consented_at)
    const eventData = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [profileToSubscribe]
          }
        }
      }
    }

    console.log(JSON.stringify(eventData, null, 2))
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
