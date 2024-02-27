import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Group user in Prodeology',
  defaultSubscription: 'type = "group"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'Anonymous id',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      description: 'The group id',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    traits: {
      type: 'object',
      label: 'Traits',
      description: 'Traits to associate with the group',
      default: { '@path': '$.traits' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    messageId: {
      type: 'string',
      required: true,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api-dev.prodeology.com/api/v1/event-collection/group', {
      method: 'post',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        groupId: payload.groupId,
        traits: payload.traits,
        messageId: payload.messageId,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
