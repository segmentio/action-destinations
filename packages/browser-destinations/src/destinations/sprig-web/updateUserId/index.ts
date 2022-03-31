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
    if (!payload || typeof payload !== 'object' || !(payload.userId || payload.anonymousId)) return

    const sprigIdentifyAndSetAttributesPayload: { userId?: string; anonymousId?: string } = {}

    if (payload.userId) {
      sprigIdentifyAndSetAttributesPayload.userId = payload.userId
    }

    if (payload.anonymousId) {
      sprigIdentifyAndSetAttributesPayload.anonymousId = payload.anonymousId
    }

    Sprig('identifyAndSetAttributes', sprigIdentifyAndSetAttributesPayload)
  }
}

export default action
