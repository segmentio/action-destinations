import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import omit from 'lodash/omit'

import { BASE_URL } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Event',
  description: 'Send group traits to Kameleoon',
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
    type: {
      label: 'Type',
      type: 'string',
      required: true,
      description: 'The type of the event',
      default: {
        '@path': '$.type'
      }
    },
    groupId: {
      type: 'string',
      description: 'The group id',
      label: 'Group ID',
      required: true,
      default: { '@path': '$.groupId' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Traits to send with the event',
      label: 'User Traits',
      default: {
        '@path': '$.traits'
      }
    },
    kameleoonVisitorCode: {
      type: 'string',
      required: false,
      description: 'Kameleoon Visitor Code - a unique identifier for the user',
      label: 'Kameleoon Visitor Code',
      default: {
        '@path': '$.traits.kameleoonVisitorCode'
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
