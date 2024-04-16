import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group',
  description: 'Create or update an account in Hilo',
  defaultSubscription: 'type = "group"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    groupId: {
      type: 'string',
      description: 'The group ID',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
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
      required: true,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api.hilohq.com/v1/events/group', {
      method: 'post',
      json: {
        event: {
          anonymous_id: payload.anonymousId,
          account_id: payload.groupId,
          contact_id: payload.userId,
          timestamp: payload.timestamp,
          properties: payload.traits
        }
      }
    })
  }
}

export default action
