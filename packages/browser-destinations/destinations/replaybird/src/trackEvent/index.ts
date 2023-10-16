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
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
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
    }
  },
  perform: (replaybird, event) => {
    // Invoke Partner SDK here
    const payload = event.payload
    if (payload) {
      replaybird.capture(payload.name, payload.properties ?? {})
    }
  }
}

export default action
