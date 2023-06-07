import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send an Event to Koala.',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    sent_at: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Sent At',
      default: { '@path': '$.sent_at' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
    },
    message_id: {
      type: 'string',
      required: true,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, data) => {
    return request(`https://api2.getkoala.com/web/projects/${data.settings.public_key}/batch`, {
      method: 'post',
      json: {
        // profile_id: '',
        // email: '',
        // traits: {},
        events: [
          {
            type: 'track',
            ...data.payload
          }
        ]
      }
    })
  }
}

export default action
