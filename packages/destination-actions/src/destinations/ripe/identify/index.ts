import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify user in Ripe',
  defaultSubscription: 'type = "identify"',
  fields: {
    anonymousId: {
      type: 'string',
      allowNull: true,
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      allowNull: true,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      allowNull: true,
      description: 'The group id',
      label: 'Group ID',
      default: { '@path': '$.context.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the user',
      required: false,
      default: { '@path': '$.traits' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    messageId: {
      type: 'string',
      required: false,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, { payload, settings }) => {
    return request(`${settings.endpoint}/identify`, {
      method: 'post',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        context: {
          groupId: payload.groupId
        },
        traits: payload.traits,
        messageId: payload.messageId,
        timestamp: payload.timestamp ?? new Date()
      }
    })
  }
}

export default action
