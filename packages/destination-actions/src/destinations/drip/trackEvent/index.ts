import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send track() events to Drip',
  defaultSubscription: 'type = "track"',
  fields: {
    action: {
      description: 'The name of the action.',
      label: 'Action',
      required: true,
      type: 'string',
      default: { '@path': '$.event' }
    },
    email: {
      description: "The person's email address.",
      label: 'Email Address',
      required: true,
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    properties: {
      description: 'Additional properties associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: { '@path': '$.properties' }
    }
  },

  perform: (request, { settings, payload }) => {
    return request(`https://api.getdrip.com/v2/${settings.accountId}/events`, {
      method: 'POST',
      json: {
        events: [
          {
            email: payload.email,
            action: payload.action,
            properties: payload.properties
          }
        ]
      }
    })
  }
}

export default action
