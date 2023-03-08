import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Register page view in Ripe',
  defaultSubscription: 'type = "page"',
  fields: {
    anonymousId: {
      type: 'string',
      allowNull: true,
      description: 'An anonymous identifier',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    userId: {
      type: 'string',
      allowNull: true,
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    groupId: {
      type: 'string',
      allowNull: true,
      description: 'The group id',
      label: 'Group ID',
      default: { '@path': '$.context.groupId' }
    },
    properties: {
      type: 'object',
      required: false,
      allowNull: false,
      description: 'Page properties',
      label: 'Properties',
      default: { '@path': '$.properties' }
    },
    name: {
      type: 'string',
      required: false,
      allowNull: false,
      description: 'The name of the page',
      label: 'Page Name',
      default: { '@path': '$.properties.name' }
    },
    url: {
      type: 'string',
      format: 'uri',
      allowNull: true,
      description: 'The page URL',
      label: 'Page URL',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.url' },
          then: { '@path': '$.context.page.url' },
          else: { '@path': '$.properties.url' }
        }
      }
    },
    path: {
      type: 'string',
      allowNull: true,
      description: 'The page path',
      label: 'Page Path',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.path' },
          then: { '@path': '$.context.page.path' },
          else: { '@path': '$.properties.path' }
        }
      }
    },
    search: {
      type: 'string',
      allowNull: true,
      description: 'URL query string',
      label: 'Page Query String',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.search' },
          then: { '@path': '$.context.page.search' },
          else: { '@path': '$.properties.search' }
        }
      }
    },
    referrer: {
      type: 'string',
      allowNull: true,
      description: 'The page referrer',
      label: 'Page Referrer',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.referrer' },
          then: { '@path': '$.context.page.referrer' },
          else: { '@path': '$.properties.referrer' }
        }
      }
    },
    title: {
      type: 'string',
      allowNull: true,
      description: 'The page title',
      label: 'Page Title',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.title' },
          then: { '@path': '$.context.page.title' },
          else: { '@path': '$.properties.title' }
        }
      }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: false,
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
  perform: (request, { payload, settings }) => {
    return request(`${settings.endpoint}/page`, {
      method: 'post',
      json: {
        anonymousId: payload.anonymousId,
        userId: payload.userId,
        context: {
          groupId: payload.groupId,
          page: {
            url: payload.url,
            path: payload.path,
            search: payload.search,
            referrer: payload.referrer,
            title: payload.title
          }
        },
        properties: payload.properties,
        name: payload.name,
        messageId: payload.messageId,
        timestamp: payload.timestamp ?? new Date()
      }
    })
  }
}

export default action
