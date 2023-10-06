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
      description: 'A identifier for a known user.',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'An identifier for an anonymous user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    email: {
      type: 'string',
      required: true,
      description: 'The email address for the user',
      label: 'Email address',
      default: { '@path': '$.traits.email' }
    },
    first_name: {
      type: 'string',
      required: false,
      description: 'The First Name of the user',
      label: 'User First Name',
      default: { '@path': '$.traits.first_name' }
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
  perform: (UserMotion, event) => {
    const { userId, email, traits } = event.payload

    if (!userId) return

    const properties = typeof traits === 'object' ? { ...traits } : undefined
    UserMotion.identify(userId, properties)
  }
}

export default action
