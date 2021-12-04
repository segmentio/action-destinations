import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Update User ID',
  description: 'Set updated user ID.',
  platform: 'web',
  defaultSubscription: 'type = "alias"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'New unique identifier for the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'New anonymous identifier for the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
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
  }
}

export default action
