import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Screeb } from '../types'

const action: BrowserActionDefinition<Settings, Screeb, Payload> = {
  title: 'Alias',
  description: 'Update user identity with new user ID.',
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
  perform: (Screeb, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !(payload.userId || payload.anonymousId)) {
      console.warn(
        '[Screeb] received invalid payload (expected userId or anonymousId to be present); skipping alias',
        payload
      )
      return
    }

    Screeb('identity', payload.userId ?? payload.anonymousId)
  }
}

export default action
