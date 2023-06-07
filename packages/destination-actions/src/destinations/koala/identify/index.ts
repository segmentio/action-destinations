import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { KOALA_PATH } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Send an Identify call to Koala.',
  defaultSubscription: 'type = "identify"',
  fields: {
    email: {
      type: 'string',
      label: 'Email',
      description: 'The email to associate with the user',
      required: false,
      default: { '@path': '$.email' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the user',
      required: false,
      default: { '@path': '$.traits' }
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
    const profileId = data.payload.traits?.profile_id
    const traits = data.payload.traits ?? {}
    const email = data.payload.email ?? data.payload.traits?.email ?? traits.email
    const ip = data.payload.traits?.ip ?? data.payload.device_ip

    if (!profileId && !email) {
      // Skip call if no identifier is found
      return
    }

    return request(`${KOALA_PATH}/${data.settings.public_key}/batch`, {
      method: 'post',
      json: {
        profile_id: profileId,
        email,
        traits,
        ip,
        identify: [
          {
            type: 'identify',
            ...data.payload
          }
        ]
      }
    })
  }
}

export default action
