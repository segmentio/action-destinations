import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Screen',
  description: 'Track mobile screen view in Hilo',
  defaultSubscription: 'type = "screen"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    name: {
      type: 'string',
      label: 'Name',
      description: 'Mobile screen name',
      required: false,
      default: { '@path': '$.name' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the screen view',
      required: false,
      default: { '@path': '$.properties' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the screen view',
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
    return request('https://api.hilohq.com/v1/events/screen', {
      method: 'post',
      json: {
        event: {
          anonymous_id: payload.anonymousId,
          contact_id: payload.userId,
          name: payload.name,
          timestamp: payload.timestamp,
          properties: payload.properties
        }
      }
    })
  }
}

export default action
