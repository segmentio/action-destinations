import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseUrl } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track an event',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      label: 'User ID',
      type: 'string',
      required: true,
      description: 'The user identifier to associate the event with',
      default: { '@path': '$.userId' }
    },
    event: {
      label: 'Event Name',
      type: 'string',
      required: true,
      description: 'Name of the Segment track() event',
      default: { '@path': '$.event' }
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
    properties: {
      label: 'Event Properties',
      type: 'object',
      required: false,
      description: 'Additional information associated with the track() event',
      default: { '@path': '$.properties' }
    },
    groupId: {
      label: 'Group ID',
      type: 'object',
      required: false,
      description: 'Company ID associated with the event',
      default: { '@path': '$.context.group_id' }
    }
  },
  perform: (request, { payload }) => {
    return request(baseUrl, {
      method: 'POST',
      json: {
        userId: payload.userId,
        event: payload.event,
        messageId: payload.messageId,
        timestamp: payload.timestamp,
        properties: payload.properties,
        groupId: payload.groupId
      }
    })
  }
}

export default action
