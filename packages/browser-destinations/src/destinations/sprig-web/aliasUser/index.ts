import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Alias User',
  description: 'Set user ID and/or attributes',
  platform: 'web',
  defaultSubscription: 'type = "alias"',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'New unique identifier for the merged user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'New anonymous identifier for the merged user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },
  perform: (Sprig, event) => {
    if (event.payload.userId) {
      Sprig('setUserId', event.payload.userId)
    }

    if (event.payload.anonymousId) {
      Sprig('setPartnerAnonymousId', event.payload.anonymousId)
    }
  }
}

export default action
