import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Track event in Hilo',
  defaultSubscription: 'type = "track"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    event: {
      type: 'string',
      label: 'Name',
      description: 'Event name',
      required: false,
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the event',
      required: false,
      default: { '@path': '$.properties' }
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
    return request('https://api.hilohq.com/v1/events/track', {
      method: 'post',
      json: {
        event: {
          anonymous_id: payload.anonymousId,
          contact_id: payload.userId,
          name: payload.event,
          timestamp: payload.timestamp,
          properties: payload.properties
        }
      }
    })
  }
}

export default action
