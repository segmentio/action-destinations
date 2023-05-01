import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import AdobeTarget from '../adobeTarget_operations'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Update Profile',
  description: 'Update an existing user profile in Adobe Target.',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_id: {
      label: 'Mbox 3rd Party ID',
      description:
        "A user's unique visitor ID. This field is used to fetch a matching profile in Adobe Target to make an update on. For more information, please see our Adobe Target Destination documentation.",
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    traits: {
      label: 'Profile Attributes',
      description:
        'Profile parameters specific to a user. Please note, Adobe recommends that PII is hashed prior to sending to Adobe.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue'
    }
  },

  perform: async (request, { settings, payload, statsContext }) => {
    console.log('A new log for something important')
    const at: AdobeTarget = new AdobeTarget(payload.user_id, settings.client_code, payload.traits, request)
    return await at.updateProfile(statsContext)
  }
}

export default action
