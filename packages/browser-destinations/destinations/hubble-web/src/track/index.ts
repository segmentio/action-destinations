import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Hubble } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubble, Payload> = {
  title: 'Track',
  description: 'Track events to trigger Hubble surveys',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    event: {
      description: 'Event to be tracked',
      label: 'Event',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    attributes: {
      description: 'Object containing the attributes (properties) of the event',
      type: 'object',
      required: false,
      label: 'Event Attributes',
      default: {
        '@path': '$.properties'
      }
    },
    userId: {
      description: 'Unique identifer of the user',
      type: 'string',
      required: false,
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      description: 'Anonymous identifier of the user',
      type: 'string',
      required: false,
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (hubble, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !payload.event) {
      return
    }

    hubble.track &&
      hubble.track({
        event: payload.event,
        attributes: payload.attributes,
        userId: payload.userId,
        anonymousId: payload.anonymousId
      })
  }
}

export default action
