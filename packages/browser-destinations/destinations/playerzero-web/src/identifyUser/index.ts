import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import { PlayerZero } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, PlayerZero, Payload> = {
  title: 'Identify User',
  description: 'Sets the user identity',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: "The user's anonymous id",
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      type: 'string',
      required: false,
      description: "The user's name",
      label: 'Display Name',
      default: {
        '@path': '$.traits.name'
      }
    },
    email: {
      type: 'string',
      required: false,
      description: "The user's email",
      label: 'Email',
      default: {
        '@path': '$.traits.email'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be included as metadata in PlayerZero',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (playerzero, event) => {
    let newTraits: Record<string, unknown> = {}

    if (event.payload.traits) {
      newTraits = Object.entries(event.payload.traits).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [cleanKey(key)]: value
        }),
        {}
      )
    }

    if (event.payload.anonymousId) {
      newTraits.segmentAnonymousId = event.payload.anonymousId
    }

    if (event.payload.userId) {
      playerzero.identify(event.payload.userId, newTraits)
    } else {
      playerzero.setUserVars({
        ...newTraits,
        ...(event.payload.email !== undefined && { email: event.payload.email }),
        ...(event.payload.name !== undefined && { name: event.payload.name })
      })
    }
  }
}

/**
 * Clean up variable name to be compatible with
 *
 * @param {string} key
 */
function cleanKey(key: string) {
  return key.trim().toLowerCase().replace(' ', '_')
}

export default action
