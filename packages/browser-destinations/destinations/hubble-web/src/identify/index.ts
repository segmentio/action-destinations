import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Hubble } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubble, Payload> = {
  title: 'Identify',
  description: 'Identify user',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      label: 'User ID',
      description: 'Unique user ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'Anonymous id of the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    attributes: {
      type: 'object',
      required: false,
      description: 'User traits used to enrich user identification',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (hubble, event) => {
    const payload = event.payload
    if (!payload || typeof payload !== 'object' || !payload.userId) {
      return
    }

    hubble.identify &&
      hubble.identify(payload.userId, {
        anonymousId: payload.anonymousId,
        ...payload.attributes
      })
  }
}

export default action
