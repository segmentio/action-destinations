import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'

import { BASE_URL } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send a track event to Kameleoon',
  defaultSubscription: 'type = "track"',
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
    event: {
      type: 'string',
      required: false,
      description: 'The event name',
      label: 'Event Name',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    type: {
      label: 'Type',
      type: 'string',
      required: true,
      description: 'The type of the event',
      default: {
        '@path': '$.type'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Additional event Properties or user Traits to send with the event',
      label: 'Event properties or user traits',
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    kameleoonVisitorCode: {
      type: 'string',
      required: false,
      description: 'Kameleoon Visitor Code - a unique identifier for the user',
      label: 'Kameleoon Visitor Code',
      default: {
        '@if': {
          exists: { '@path': '$.properties.kameleoonVisitorCode' },
          then: { '@path': '$.properties.kameleoonVisitorCode' },
          else: { '@path': '$.traits.kameleoonVisitorCode' }
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    context: {
      type: 'object',
      required: false,
      description: 'Context properties to send with the event',
      label: 'Context properties',
      default: { '@path': '$.context' }
    },
    messageId: {
      type: 'string',
      required: true,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    }
  },
  perform: (request, data) => {
    const payload = {
      ...omit(data.payload, ['kameleoonVisitorCode']),
      properties: {
        ...(data.payload.properties || {}),
        kameleoonVisitorCode: data.payload.kameleoonVisitorCode
      }
    }
    return request(BASE_URL, {
      headers: {
        authorization: `Basic ${data.settings.apiKey}`,
        'x-segment-settings': data.settings.sitecode
      },
      method: 'post',
      json: payload
    })
  }
}

export default action
