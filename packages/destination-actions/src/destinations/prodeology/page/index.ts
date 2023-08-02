import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Event',
  description: 'Send a page event to Prodeology.',
  defaultSubscription: 'type = "page"',
  fields: {
    anonymousId: {
      type: 'string',
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Page properties',
      label: 'Properties',
      default: { '@path': '$.properties' }
    },
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page',
      label: 'Page Name',
      default: { '@path': '$.properties.name' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
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
      required: false,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, { payload }) => {
    return request('https://api-dev.prodeology.com/api/v1/event-collection/page', {
      method: 'POST',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        properties: payload.properties,
        name: payload.name,
        context: payload.context,
        timestamp: payload.timestamp
      }
    })
  }
}

export default action
