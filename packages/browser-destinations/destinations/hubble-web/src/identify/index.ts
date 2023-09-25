import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import { Hubble } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubble, Payload> = {
  title: 'Identify',
  description: 'Set identifiers and attributes for a user',
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      description: 'Unique identifer of the user',
      type: 'string',
      required: true,
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      description: 'Anonymous identifier of the user',
      type: 'string',
      required: false,
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    attributes: {
      description: 'User traits used to enrich user identification',
      type: 'object',
      required: false,
      label: 'User Attributes (Traits)',
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
      hubble.identify({ userId: payload.userId, anonymousId: payload.anonymousId, attributes: payload.attributes })
  }
}

export default action
