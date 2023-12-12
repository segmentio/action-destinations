import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Bucket } from '../types'

const action: BrowserActionDefinition<Settings, Bucket, Payload> = {
  title: 'Identify User',
  description: 'Creates or updates a user profile in Bucket. Also initializes Live Satisfaction',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: 'Unique identifier for the User',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Additional information to associate with the User in Bucket',
      label: 'User Attributes',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (bucket, { payload }) => {
    void bucket.user(payload.userId, payload.traits)
  }
}

export default action
