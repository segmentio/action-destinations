import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { client_id } from '../ga4-properties'
const normalize_event_name = (name: string, lowercase: boolean): string => {
  name = name.replace(/\s/g, '_')

  if (lowercase === true) {
    name = name.toLowerCase()
  }
  return name
}
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
    lowercase: {
      label: 'Lowercase Event Name',
      description: 'If set to true, event name will be converted to lowercase before sending to Google.',
      type: 'boolean',
      default: false
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
    const event_name = normalize_event_name(payload.name, payload.lowercase ? payload.lowercase : false)
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.clientId,
        events: [
          {
            name: event_name,
            params: payload.params
          }
        ]
      }
    })
  }
}
export default action
