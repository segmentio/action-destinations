import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseUrl } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Register Company',
  description: 'Register a user in a company',
  defaultSubscription: 'type = "group"',
  fields: {
    userId: {
      label: 'User ID',
      type: 'string',
      required: true,
      description: 'The user identifier to associate the event with',
      default: { '@path': '$.userId' }
    },
    messageId: {
      label: 'Message ID',
      type: 'string',
      description: 'A unique value for each event.',
      default: {
        '@path': '$.messageId'
      }
    },
    timestamp: {
      label: 'Event Timestamp',
      type: 'string',
      required: true,
      description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
      default: { '@path': '$.timestamp' }
    },
    traits: {
      label: 'COmpany Traits',
      type: 'object',
      required: false,
      description: 'Company profile information',
      default: { '@path': '$.traits' }
    },
    groupId: {
      label: 'Group ID',
      type: 'string',
      required: true,
      description: 'Company ID associated with the event',
      default: { '@path': '$.groupId' }
    }
  },
  perform: (request, { payload }) => {
    return request(baseUrl, {
      method: 'POST',
      json: {
        userId: payload.userId,
        messageId: payload.messageId,
        timestamp: payload.timestamp,
        traits: payload.traits,
        groupId: payload.groupId
      }
    })
  }
}

export default action
