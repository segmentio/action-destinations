import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Iterate as IterateClient, Command } from '../types'

const action: BrowserActionDefinition<Settings, IterateClient, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's identity.",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Iterate.',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (Iterate, event) => {
    const traits = event.payload.traits || {}

    if (event.payload.userId) {
      traits['external_id'] = event.payload.userId
    }

    Iterate(Command.Identify, traits)
  }
}

export default action
