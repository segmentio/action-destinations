import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { JimoClient } from 'src/types'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, JimoClient, Payload> = {
  title: 'Send Track Event',
  description: 'Submit an event to Jimo',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    messageId: {
      description: 'The internal id of the message.',
      label: 'Message Id',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      description: 'The timestamp of the event.',
      label: 'Timestamp',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    event_name: {
      description: 'The name of the event.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      description: 'A unique identifier for the user.',
      label: 'User ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      description: 'An anonymous identifier for the user.',
      label: 'Anonymous ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.anonymousId'
      }
    },
    properties: {
      description: 'Information associated with the event',
      label: 'Event Properties',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (jimo, { payload }) => {
    const { event_name, userId, anonymousId, timestamp, messageId, properties } = payload
    const receivedAt = timestamp

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    jimo
      .client()
      .push([
        'do',
        'segmentio:track',
        [{ event: event_name, userId, anonymousId, messageId, timestamp, receivedAt, properties }]
      ])
    window.dispatchEvent(new CustomEvent(`jimo-segmentio-track:${event_name}`))
  }
}

export default action
