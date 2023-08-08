import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      description: 'A JSON object containing the properties of the event.',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    context: {
      label: 'Event context',
      description: 'Event context as it appears in Segment',
      type: 'object',
      required: false,
      default: { '@path': '$.context' }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'The anonymous ID associated with the user',
      type: 'string',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    message_id: {
      label: 'Message ID',
      description: 'The Segment messageId',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the event took place. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    received_at: {
      label: 'Time',
      description: 'When the event was received.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    },
    sent_at: {
      label: 'Time',
      description: 'When the event was sent.',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.receivedAt'
      }
    },
    user_id: {
      type: 'string',
      required: true,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/event', {
      method: 'post',
      json: payload
    })
  }
}

export default action
