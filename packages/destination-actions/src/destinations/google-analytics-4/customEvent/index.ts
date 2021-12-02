import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send any custom event',
  defaultSubscription: 'type = "track"',
  fields: {
    clientId: { ...client_id },
    name: {
      label: 'Event Name',
      description: 'The unique name of the custom event created in GA4.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    params: {
      label: 'Event Parameters',
      description: 'The event parameters to send to Google',
      type: 'object',
      additionalProperties: true,
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.clientId,
        events: [
          {
            name: payload.name,
            params: payload.params
          }
        ]
      }
    })
  }
}

export default action
