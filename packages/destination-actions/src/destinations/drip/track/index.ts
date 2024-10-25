import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types' // Get these to generate

import { baseUrl, headers } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Track event in Drip',
  fields: {
    email: {
      description: "The person's email address.",
      label: 'Email Address',
      required: true,
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    action: {
      description: 'The name of the action.',
      label: 'Action',
      required: true,
      type: 'string',
      default: { '@path': '$.event' }
    },
    properties: {
      description: 'A JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: { '@path': '$.properties' }
    }
  },

  perform: (request, { settings, payload }) => {
    return request(`${baseUrl}/v2/3977335/events`, {
      method: 'POST',
      headers: headers(settings),
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
