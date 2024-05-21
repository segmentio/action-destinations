import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Analytics Event',
  description: 'Send user and page events to UserMotion',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    userId: {
      type: 'string',
      required: false,
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
    eventName: {
      type: 'string',
      required: true,
      description: 'The name of the track() event or page() event',
      label: 'Event Name',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@template': 'pageview' }
        }
      }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event.',
      label: 'Event Properties',
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api.usermotion.com/v1/track', {
      method: 'post',
      json: {
        event: payload.eventName,
        userId: payload.userId,
        anonymousId: payload.anonymousId,
        context: {
          ...payload.context
        },
        properties: {
          ...payload.properties
        }
      }
    })
  }
}

export default action
