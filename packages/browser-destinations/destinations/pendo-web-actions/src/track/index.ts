import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Track Event',
  description: 'Send Segment track() events to Pendo',
  defaultSubscription: 'type="track"',
  platform: 'web',
  fields: {
    event: {
      label: 'Event name',
      description: 'The name of the analytics event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    metadata: {
      label: 'Metadata',
      description: 'Additional metadata to include in the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (pendo, { payload }) => {
    pendo.track(payload.event, payload.metadata)
  }
}

export default action
