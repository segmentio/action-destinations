import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { baseURL } from '..'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track',
  description: 'Tracks user events',
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
    ipAddress: {
      label: 'IP Address',
      description: "The users's IP address.",
      type: 'string',
      required: false,
      default: { '@path': '$.context.ip' }
    },
    timezone: {
      label: 'Timezone',
      description: 'Timezone',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.timezone'
      }
    },
    userId: {
      type: 'string',
      description: 'The ID associated with the user',
      label: 'User ID',
      default: { '@path': '$.userId' }
    },
    campaign: {
      type: 'object',
      required: false,
      description: 'UTM campaign information.',
      label: 'Campaign',
      default: {
        name: { '@path': '$.context.campaign.name' },
        source: { '@path': '$.context.campaign.source' },
        medium: { '@path': '$.context.campaign.medium' },
        term: { '@path': '$.context.campaign.term' },
        content: { '@path': '$.context.campaign.content' }
      },
      properties: {
        name: {
          type: 'string',
          required: false,
          description: 'The name of the campaign.',
          label: 'Name'
        },
        source: {
          type: 'string',
          required: false,
          description: 'The source of the campaign.',
          label: 'Source'
        },
        medium: {
          type: 'string',
          required: false,
          description: 'The medium of the campaign.',
          label: 'Medium'
        },
        term: {
          type: 'string',
          required: false,
          description: 'The term of the campaign.',
          label: 'Term'
        },
        content: {
          type: 'string',
          required: false,
          description: 'The content of the campaign.',
          label: 'Content'
        }
      }
    },
    page: {
      type: 'object',
      required: false,
      description: 'Information about the page where the event occurred.',
      label: 'Page',
      default: {
        url: { '@path': '$.context.page.url' },
        title: { '@path': '$.context.page.title' },
        referrer: { '@path': '$.context.page.referrer' },
        path: { '@path': '$.context.page.path' },
        search: { '@path': '$.context.page.search' }
      },
      properties: {
        url: {
          type: 'string',
          required: false,
          description: 'The URL of the page where the event occurred.',
          label: 'URL'
        },
        title: {
          type: 'string',
          required: false,
          description: 'The title of the page where the event occurred.',
          label: 'Title'
        },
        referrer: {
          type: 'string',
          required: false,
          description: 'The referrer of the page where the event occurred.',
          label: 'Referrer'
        },
        path: {
          type: 'string',
          required: false,
          description: 'The path of the page where the event occurred.',
          label: 'Path'
        },
        search: {
          type: 'string',
          required: false,
          description: 'The search query of the page where the event occurred.',
          label: 'Search'
        }
      }
    }
  },
  perform: (request, data) => {
    return request(baseURL, {
      method: 'post',
      json: [data.payload]
    })
  },
  performBatch: (request, data) => {
    return request(baseURL, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
