import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Hubble } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubble, Payload> = {
  title: 'Track',
  description: 'Track event',
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
    }
  },
  perform: (hubble, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !payload.event) {
      return
    }

    hubble.track && hubble.track(payload.event, payload.attributes)
  }
}

export default action
