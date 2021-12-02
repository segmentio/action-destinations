import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Identify User',
  description: 'Set user ID and/or attributes.',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'Unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'Anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment user traits to be forwarded to Sprig and set as attributes',
      label: 'User Attributes',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (Sprig, event) => {
    const payload = event.payload
    if (!payload) return

    if (payload.userId) {
      Sprig('setUserId', payload.userId)
    }

    if (payload.anonymousId) {
      Sprig('setPartnerAnonymousId', payload.anonymousId)
    }

    const traits = { ...payload.traits }
    if (traits.email) {
      traits['!email'] = traits.email
      delete traits.email
    }

    Sprig('setAttributes', traits)
  }
}

export default action
