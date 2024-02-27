import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
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
    if (!payload || typeof payload !== 'object' || !(payload.userId || payload.anonymousId || payload.traits)) {
      console.warn(
        '[Sprig] received invalid payload (expected userId, anonymousId, or traits to be present); skipping identifyUser',
        payload
      )
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sprigIdentifyAndSetAttributesPayload: {
      userId?: string
      anonymousId?: string
      attributes?: { [key: string]: any }
    } = {}

    if (payload.userId) {
      sprigIdentifyAndSetAttributesPayload.userId = payload.userId
    }

    if (payload.anonymousId) {
      sprigIdentifyAndSetAttributesPayload.anonymousId = payload.anonymousId
    }

    if (payload.traits && Object.keys(payload.traits).length > 0) {
      const traits = { ...payload.traits }
      if (traits.email) {
        traits['!email'] = traits.email
        delete traits.email
      }
      sprigIdentifyAndSetAttributesPayload.attributes = traits
    }

    Sprig('identifyAndSetAttributes', sprigIdentifyAndSetAttributesPayload)
  }
}

export default action
