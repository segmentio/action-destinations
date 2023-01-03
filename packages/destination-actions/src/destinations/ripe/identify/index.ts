import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { randomUUID } from 'crypto'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify user in Ripe',
  defaultSubscription: 'type = "identify"',
  fields: {
    anonymousId: {
      type: 'string',
      allowNull: true,
      description: 'The anonymized user id',
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
      type: 'datetime',
      required: false,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    }
  },
  perform: (request, { settings, payload }) => {
    return request(`${settings.endpoint}/identify`, {
      method: 'post',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        context: {
          groupId: payload.groupId
        },
        traits: payload.traits,
        messageId: randomUUID(),
        timestamp: payload.timestamp ?? new Date()
      }
    })
  }
}

export default action
