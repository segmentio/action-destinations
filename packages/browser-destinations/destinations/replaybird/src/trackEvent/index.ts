import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ReplayBird } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, ReplayBird, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The track() event name or page() name for the event.',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    properties: {
      description:
        'A JSON object containing additional information about the event that will be indexed by replaybird.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    userId: {
      description: 'A unique ID for a known user',
      label: 'User ID',
      required: false,
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      description: 'A unique ID for a anonymous user',
      label: 'Anonymous ID',
      required: false,
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (replaybird, event) => {
    // Invoke Partner SDK here
    const payload = event.payload
    if (payload) {
      replaybird.capture(payload.name, {
        ...payload.properties,
        userId: payload.userId,
        anonymousId: payload.anonymousId
      })
    }
  }
}

export default action
