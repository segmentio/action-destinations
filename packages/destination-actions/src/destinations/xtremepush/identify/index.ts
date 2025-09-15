import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send User Profile Data to XtremePush',
  defaultSubscription: 'type = "identify"',
  fields: {
    type: {
      label: 'Event type',
      description: 'The type of the event',
      type: 'string',
      default: { '@path': '$.type' },
      required: true
    },
    identifiers: {
      label: 'Identifiers',
      description: 'The unique identifiers for the user',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      properties: {
        userId: {
          label: 'User ID',
          type: 'string',
          required: false,
        },
        anonymousId: {
          label: 'Anonymous ID',
          type: 'string',
          required: false,
        },
        phone: {
          label: 'Phone',
          type: 'string',
          required: false
        },
        email: {
          label: 'Email',
          type: 'string',
          format: 'email',
          required: false
        }
      },
      default: {
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        phone: { '@path': '$.traits.phone' },
        email: { '@path': '$.traits.email' }
      }
    },
    traits: {
      label: 'User Attributes',
      description: 'Attributes assocatiated with the user.',
      type: 'object',
      required: false,
      default: {'@path': '$.traits'}
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'string',
      required: true,
      default: {'@path': '$.timestamp'}
    },
    messageId: {
      label: 'Message ID',
      description: 'The message ID of the event.',
      type: 'string',
      required: true,
      default: {'@path': '$.messageId'}
    }
  },
  perform: (request, {settings, payload}) => {
    const host = settings.url.endsWith('/') ? settings.url.slice(0, -1) : settings.url;

    return request(host + '/api/integration/segment/handle', {
      method: 'post',
      json: {
        type: payload.type,
        ...payload.identifiers,
        traits: payload.traits,
        timestamp: payload.timestamp,
        messageId: payload.messageId
      }
    })
  }
}

export default action
