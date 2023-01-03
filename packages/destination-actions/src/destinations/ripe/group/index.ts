import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { randomUUID } from 'crypto'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Group user in Ripe',
  defaultSubscription: 'type = "group"',
  fields: {
    anonymousId: {
      type: 'string',
      required: true,
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
      required: true,
      description: 'The group id',
      label: 'Group ID',
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the group',
      allowNull: true,
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
  perform: (request, { payload }) => {
    return request('https://core-backend-dot-production-365112.ey.r.appspot.com/api/group', {
      method: 'post',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        groupId: payload.groupId,
        traits: payload.traits,
        messageId: randomUUID(),
        timestamp: payload.timestamp ?? new Date()
      }
    })
  }
}

export default action
