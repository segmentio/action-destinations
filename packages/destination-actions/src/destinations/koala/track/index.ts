import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { KOALA_PATH } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Send an Event to Koala.',
  defaultSubscription: 'type = "track"',
  fields: {
    email: {
      type: 'string',
      label: 'Email',
      description: 'The email to associate with the user',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    event: {
      type: 'string',
      required: true,
      description: 'The event name',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event',
      label: 'Event properties',
      default: { '@path': '$.properties' }
    },
    sent_at: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Sent At',
      default: { '@path': '$.timestamp' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'Traits inherited from the context object',
      label: 'Context properties',
      default: { '@path': '$.context.traits' }
    },
    device_ip: {
      type: 'string',
      required: false,
      description: 'The device IP collected from the context',
      label: 'Context properties',
      default: { '@path': '$.context.ip' }
    },
    message_id: {
      type: 'string',
      required: true,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, data) => {
    const profileId = data.payload.properties?.profile_id
    const traits = data.payload.traits ?? {}
    const email = data.payload.email ?? data.payload.properties?.email ?? traits.email
    const ip = data.payload.properties?.ip ?? data.payload.device_ip

    if (!profileId && !email) {
      // Skip call if no identifier is found
      return Promise.resolve()
    }

    return request(`${KOALA_PATH}/${data.settings.public_key}/batch`, {
      method: 'post',
      json: {
        profile_id: profileId,
        email,
        traits,
        ip,
        events: [
          {
            type: 'track',
            ...data.payload
          }
        ]
      }
    })
  }
}

export default action
