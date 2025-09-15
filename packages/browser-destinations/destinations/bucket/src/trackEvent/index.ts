import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Bucket } from '../types'

const action: BrowserActionDefinition<Settings, Bucket, Payload> = {
  title: 'Track Event',
  description: 'Map a Segment track() event to Bucket',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The event name',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      type: 'string',
      required: true,
      allowNull: false,
      description: 'Unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Object containing the properties of the event',
      label: 'Event Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (bucket, { payload }) => {
    // Ensure we never call Bucket.track() without a user ID
    if (payload.userId) {
      void bucket.track(payload.name, payload.properties, payload.userId)
    }
  }
}

export default action
