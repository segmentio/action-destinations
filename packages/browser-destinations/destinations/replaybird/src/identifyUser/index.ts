import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ReplayBird } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, ReplayBird, Payload> = {
  title: 'Identify User',
  description: 'Sets user identifier and user profile details',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: 'A unique ID for a known user',
      label: 'User Id',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to ReplayBird',
      label: 'User Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (replaybird, event) => {
    const payload = event.payload || {}
    if (payload.userId) {
      replaybird.identify(payload.userId, payload.traits || {})
    }
  }
}

export default action
