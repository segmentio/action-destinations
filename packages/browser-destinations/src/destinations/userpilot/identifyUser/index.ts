import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'

const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Identify User',
  description:
    "Create or update a user entity in Userpilot. It's mandatory to identify a user by calling identify() prior to invoking other methods such as track(), page(), or group(). You can learn more by visiting the [Userpilot documentation](https://docs.userpilot.com/article/23-identify-users-track-custom-events).",
  platform: 'web',
  defaultSubscription: 'type = "identify"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: 'The ID of the logged-in user.',
      label: 'User ID',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    createdAt: {
      type: 'datetime',
      required: false,
      description: 'The date the user profile was created at',
      label: 'User Created At Date',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'User traits.',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, event) => {
    const { userId, traits } = event.payload

    traits?.createdAt && delete traits.createdAt

    window.userpilot.identify(userId, { ...traits, created_at: event.payload.createdAt || traits?.created_at })
  }
}

export default action
