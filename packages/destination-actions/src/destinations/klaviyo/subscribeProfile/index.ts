import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { API_URL } from '../config'
import { SubscribeProfile, SubscribeEventData } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Subscribe Profile',
  description: 'Subscribe a user in Klaviyo',
  defaultSubscription: 'type = "track"',
  fields: {
    klaviyo_id: {
      label: 'Klaviyo Id',
      description: `The unique userId of the profile in Klaviyo. If provided, this will be used to perform the profile lookup. One of email or phone number is still required.`,
      type: 'string'
    },
    email: {
      label: 'Email',
      description: `The email address to subscribe or to set on the profile if the email channel is omitted.`,
      type: 'string',
      format: 'email',
      default: { '@path': '$context.traits.email' }
    },
    subscribe_email: {
      label: 'Subscribe Profile to Email Marketing',
      description: `Controls the subscription status for email marketing. If set to "yes", the profile's consent preferences for email marketing are set to "SUBSCRIBED"; otherwise, the email channel is omitted.`,
      type: 'boolean',
      required: true,
      default: true
    },
    phone_number: {
      label: 'Phone Number',
      description: `The phone number to subscribe or to set on the profile if SMS channel is omitted. This must be in E.164 format.`,
      type: 'string',
      default: { '@path': '$context.traits.phone' }
    },
    subscribe_sms: {
      label: 'Subscribe Profile to SMS Marketing',
      description: `Controls the subscription status for SMS marketing. If set to "yes", the profile's consent preferences for SMS marketing are set to "SUBSCRIBED"; otherwise, the SMS channel is omitted.`,
      type: 'boolean',
      required: true,
      default: true
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
    const { email, klaviyo_id, phone_number, consented_at, list_id, subscribe_email, subscribe_sms } = payload
    if (!email && !phone_number) {
      throw new PayloadValidationError('Phone Number or Email is required.')
    }

    if (!subscribe_email && !subscribe_sms) {
      throw new PayloadValidationError('At least one marketing channel (Email or SMS) needs to be subscribed to.')
    }

    const profileToSubscribe = formatSubscribeProfile(
      email,
      phone_number,
      klaviyo_id,
      consented_at,
      subscribe_sms,
      subscribe_email
    )
    const eventData: SubscribeEventData = {
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

    console.log(JSON.stringify(eventData, null, 2))
    return
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
  consented_at: string | number | undefined,
  subscribe_sms: boolean,
  subscribe_email: boolean
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

  if (email && subscribe_email) {
    profileToSubscribe.attributes.subscriptions.email = {
      marketing: {
        consent: 'SUBSCRIBED',
        consented_at: consented_at
      }
    }
  }

  if (phone_number && subscribe_sms) {
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
