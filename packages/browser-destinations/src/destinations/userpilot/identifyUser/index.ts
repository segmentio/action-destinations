import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'

const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Identify User',
  description:
    'Defines a user in Userpilot, you can visit [Userpilot docs](https://docs.userpilot.com/article/23-identify-users-track-custom-events) for more information.',
  platform: 'web',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: 'User id',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'User anonymous id',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Segment traits',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, event) => {
    const userId = event.payload.userId || event.payload.anonymousId || ''
    const traits = event.payload.traits || {}

    if (traits?.createdAt) {
      traits.created_at = traits.createdAt
      delete traits.createdAt
    }

    window.userpilot.identify(userId, traits)
  }
}

export default action
