import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { UserMotion } from '../types'

const action: BrowserActionDefinition<Settings, UserMotion, Payload> = {
  title: 'Identify User',
  description: 'Identify user to UserMotion',
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
    traits: {
      type: 'object',
      required: false,
      description: 'User traits.',
      label: 'Traits',
      defaultObjectUI: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_, event) => {
    const { userId, traits } = event.payload

    window.usermotion.identify(userId, { ...traits })
  }
}

export default action
