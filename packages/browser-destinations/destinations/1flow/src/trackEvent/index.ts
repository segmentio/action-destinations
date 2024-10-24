import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { _1flow } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, _1flow, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to 1Flow.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
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
  perform: (_1flow, event) => {
    const { event_name, userId, anonymousId, properties } = event.payload
    _1flow('track', event_name, {
      userId: userId,
      anonymousId: anonymousId,
      properties: properties
    })
  }
}

export default action
