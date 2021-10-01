import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send a Custom Event',
  description: 'Send events to a custom event in GA4',
  defaultSubscription: 'type = "track"',
  fields: {
    clientId: {
      label: 'Client ID',
      description: 'Uniquely identifies a user instance of a web client.',
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
    name: {
      label: 'Event Name',
      description: 'The unique name of the custom event created in GA4.',
      type: 'string',
      required: true
    },
    params: {
      label: 'Event Parameters',
      description: 'The event parameters to send to Google',
      type: 'object',
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
