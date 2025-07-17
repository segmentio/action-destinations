import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CLAY_API_BASE_URL } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Visit',
  description: 'Send a page event to Clay',
  defaultSubscription: 'type = "page"',
  fields: {
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
      description: 'The timestamp of the page event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    url: {
      type: 'string',
      required: false,
      description: 'URL of the webpage',
      label: 'Page URL',
      default: { '@path': '$.context.page.url' }
    },
    page: {
      description: 'Contains context information regarding a webpage',
      label: 'Page',
      required: false,
      type: 'object',
      default: {
        '@path': '$.context.page'
      }
    },
    ip: {
      description: 'IP address of the user',
      label: 'IP Address',
      required: true,
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      description: 'User-Agent of the user',
      label: 'User Agent',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    anonymousId: {
      type: 'string',
      required: false,
      description: 'The anonymous ID associated with the user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      required: false,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    messageId: {
      type: 'string',
      required: true,
      description: 'The Segment messageId',
      label: 'MessageId',
      default: { '@path': '$.messageId' }
    },
    properties: {
      type: 'object',
      label: 'Properties',
      description: 'Properties to associate with the event',
      default: { '@path': '$.properties' }
    }
  },
  perform: (request, { payload, settings }) => {
    return request(`${CLAY_API_BASE_URL}/segment/${settings.connection_key}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.secret_key}`
      },
      json: payload
    })
  }
}

export default action
