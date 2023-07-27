import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Screeb } from '../types'

const action: BrowserActionDefinition<Settings, Screeb, Payload> = {
  title: 'Identify',
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
    properties: {
      type: 'object',
      required: false,
      description: 'The Segment user traits to be forwarded to Screeb and set as attributes',
      label: 'User Attributes',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (Screeb, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !(payload.userId || payload.anonymousId || payload.properties)) {
      console.warn(
        '[Screeb] received invalid payload (expected userId, anonymousId, or properties to be present); skipping identify',
        payload
      )
      return
    }

    const properties = payload.properties && Object.keys(payload.properties).length > 0 ? payload.properties : undefined

    Screeb('identity', payload.userId ?? payload.anonymousId, properties)
  }
}

export default action
