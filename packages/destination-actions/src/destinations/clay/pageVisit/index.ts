import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CLAY_API_BASE_URL } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Visit',
  description: 'Send a page event to Clay',
  defaultSubscription: 'type = "page"',
  fields: {
    name: {
      type: 'string',
      description: 'The name of the page',
      label: 'Event Name',
      required: false,
      default: { '@path': '$.name' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
      description: 'The timestamp of the page event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    page: {
      description: 'Information about the current page',
      label: 'Page',
      required: false,
      type: 'object',
      additionalProperties: false,
      properties: {
        path: {
          type: 'string',
          description: 'Path of the webpage',
          label: 'Path'
        },
        referrer: {
          type: 'string',
          description: 'Referrer of the webpage',
          label: 'Referrer'
        },
        search: {
          type: 'string',
          description: 'Search query of the webpage',
          label: 'Search Query'
        },
        title: {
          type: 'string',
          description: 'Title of the webpage',
          label: 'Title'
        },
        url: {
          type: 'string',
          description: 'Full URL of the webpage',
          label: 'Full URL'
        }
      },
      default: {
        path: { '@path': '$.context.page.path' },
        referrer: { '@path': '$.context.page.referrer' },
        search: { '@path': '$.context.page.search' },
        title: { '@path': '$.context.page.title' },
        url: { '@path': '$.context.page.url' }
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
      json: {
        ...payload,
        type: 'page'
      }
    })
  }
}

export default action
