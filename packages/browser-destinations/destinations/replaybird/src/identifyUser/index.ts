import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { ReplayBird } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, ReplayBird, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to replaybird',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (replaybird, event) => {
    if (event.payload.userId) {
      replaybird.identify(event.payload.userId, event.payload.traits)
    }
  }
}

export default action
