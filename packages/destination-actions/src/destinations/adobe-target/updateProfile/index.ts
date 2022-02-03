import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import adobeTarget from '../adobeTarget_operations'
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
      description: 'Profile parameters specific to a user.',
      type: 'object',
      required: true,
      default: {
        '@path': '$.traits'
      }
    }
  },

  perform: async (request, data) => {
    const at: adobeTarget = new adobeTarget(
      data.payload.user_id,
      data.settings.client_code,
      data.payload.traits,
      request
    )
    return at.updateProfile()
  }
}

export default action
