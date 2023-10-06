import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { UserMotion } from '../types'

const action: BrowserActionDefinition<Settings, UserMotion, Payload> = {
  title: 'Track Analytics Event',
  description: 'Send user and page events to UserMotion',
  defaultSubscription: 'type = "track" or type = page',
  platform: 'web',
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
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    event_name: {
      type: 'string',
      required: true,
      description: 'The name of the track() event or page() event',
      label: 'Event Name',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event.',
      label: 'Event Properties',
      default: { '@path': '$.properties' }
    }
  },
  perform: (UserMotion, event) => {
    const { event: eventName, properties } = event.payload
    if (!eventName) return

    const props = typeof properties === 'object' ? { ...properties } : undefined

    UserMotion.track(eventName, props)
  }
}
export default action
