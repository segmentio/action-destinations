import type { ActionDefinition, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getListIdDynamicData } from '../functions'

import { PayloadValidationError } from '@segment/actions-core'
import { API_URL } from '../config'

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
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Klaviyo',
      description: 'When enabled, the action will use the klaviyo batch API.'
    },
    list_id: {
      label: 'List Id',
      description: `The Klaviyo list to add the newly subscribed profiles to. If no List Id is present, the opt-in process used to subscribe the profile depends on the account's default opt-in settings.`,
      type: 'string',
      dynamic: true
    }
  },
  dynamicFields: {
    list_id: async (request): Promise<DynamicFieldResponse> => {
      return getListIdDynamicData(request)
    }
  },
  perform: (request, { payload }) => {
    const { email, klaviyo_id, phone_number } = payload

    if (!email && !phone_number && !klaviyo_id) {
      throw new PayloadValidationError('One of Phone Number, Email, or Klaviyo Id is required.')
    }

    const eventData = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Segment Klaviyo (Actions) Destination',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: 'jason.tu@segment.com',
                  phone_number: '+17067675127',
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    },
                    sms: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                        consented_at: '2023-08-23T14:00:00-0400'
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    }

    // subscribe requires use of 2024-02-15 api version
    return request(`${API_URL}/profile-subscription-bulk-create-jobs/`, {
      method: 'POST',
      headers: {
        revision: '2024-02-15'
      },
      json: eventData
    })
  }
}

export default action
