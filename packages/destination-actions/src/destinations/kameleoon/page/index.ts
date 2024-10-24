import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'

import { BASE_URL } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Event',
  description: 'Send a page event to Kameleoon',
  defaultSubscription: 'type = "page"',
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
      description: 'Page properties',
      label: 'Properties',
      default: { '@path': '$.properties' }
    },
    kameleoonVisitorCode: {
      type: 'string',
      required: false,
      description: 'Kameleoon Visitor Code - a unique identifier for the user',
      label: 'Kameleoon Visitor Code',
      default: { '@path': '$.properties.kameleoonVisitorCode' }
    },
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page',
      label: 'Page Name',
      default: {
        '@path': '$.name'
      }
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
