import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { randomUUID } from 'crypto'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias',
  description: 'Alias a user to new user ID in Ripe',
  defaultSubscription: 'type = "alias"',
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
      required: true,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    alias: {
      type: 'string',
      required: true,
      description: 'The alias of the user',
      label: 'Alias'
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
    return request(`${settings.endpoint}/alias`, {
      method: 'post',
      json: {
        previousId: payload.userId,
        anonymousId: payload.anonymousId,
        userId: payload.alias,
        messageId: randomUUID(),
        timestamp: payload.timestamp ?? new Date()
      }
    })
  }
}

export default action
