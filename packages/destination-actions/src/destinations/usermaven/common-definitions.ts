import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../encharge/generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  user_anonymous_Id: {
    type: 'string',
    allowNull: true,
    required: false,
    description: 'User Anonymous id',
    label: 'Anonymous ID',
    default: { '@path': '$.anonymousId' }
  },
  event_id: {
    type: 'string',
    required: false,
    description: 'The ID of the event.',
    label: 'Event ID',
    default: { '@path': '$.messageId' }
  },
  doc_path: {
    type: 'string',
    required: false,
    description: 'The path of the document.',
    label: 'Document Path',
    default: { '@path': '$.context.page.path' }
  },
  doc_search: {
    type: 'string',
    required: false,
    description: 'The search query of the document.',
    label: 'Document Search',
    default: { '@path': '$.context.page.search' }
  },
  event_type: {
    type: 'string',
    required: false,
    description: 'The type of the event.',
    label: 'Event Type',
    default: { '@path': '$.type' }
  },
  page_title: {
    type: 'string',
    required: false,
    description: 'The title of the page where the event occurred.',
    label: 'Page Title',
    default: { '@path': '$.context.page.title' }
  },
  referer: {
    type: 'string',
    required: false,
    description: 'The referrer of the page where the event occurred.',
    label: 'Referrer',
    default: { '@path': '$.context.page.referrer' }
  },
  url: {
    type: 'string',
    required: false,
    description: 'The URL of the page where the event occurred.',
    label: 'URL',
    default: { '@path': '$.context.page.url' }
  },
  user_agent: {
    type: 'string',
    required: false,
    description: 'The user agent of the browser.',
    label: 'User Agent',
    default: { '@path': '$.context.userAgent' }
  },
  user_language: {
    type: 'string',
    required: false,
    description: 'The language of the browser.',
    label: 'User Language',
    default: { '@path': '$.context.locale' }
  },
  utc_time: {
    type: 'string',
    required: false,
    description: 'The time of the event in UTC.',
    label: 'UTC Time',
    default: { '@path': '$.timestamp' }
  },
  utm: {
    type: 'object',
    required: false,
    description: 'Information about the UTM parameters.',
    label: 'UTM',
    properties: {
      source: {
        label: 'Source',
        description: 'The source of the campaign.',
        type: 'string'
      },
      medium: {
        label: 'Medium',
        description: 'The medium of the campaign.',
        type: 'string'
      },
      name: {
        label: 'Name',
        description: 'The name of the campaign.',
        type: 'string'
      },
      term: {
        label: 'Term',
        description: 'The term of the campaign.',
        type: 'string'
      },
      content: {
        label: 'Content',
        description: 'The content of the campaign.',
        type: 'string'
      }
    },
    default: {
      source: { '@path': '$.context.campaign.source' },
      medium: { '@path': '$.context.campaign.medium' },
      name: { '@path': '$.context.campaign.name' },
      term: { '@path': '$.context.campaign.term' },
      content: { '@path': '$.context.campaign.content' }
    }
  },
  screen: {
    type: 'object',
    required: false,
    description: 'Information about the screen.',
    label: 'Screen',
    properties: {
      height: {
        label: 'Height',
        description: 'The height of the screen.',
        type: 'integer'
      },
      width: {
        label: 'Width',
        description: 'The width of the screen.',
        type: 'integer'
      },
      density: {
        label: 'Density',
        description: 'The density of the screen.',
        type: 'number'
      }
    },
    default: {
      height: { '@path': '$.context.screen.height' },
      width: { '@path': '$.context.screen.width' },
      density: { '@path': '$.context.screen.density' }
    }
  },
  timezone: {
    type: 'string',
    required: false,
    description: 'The timezone of the browser.',
    label: 'Timezone',
    default: {
      '@if': {
        exists: { '@path': '$.properties.timezone' },
        then: { '@path': '$.properties.timezone' },
        else: { '@path': '$.traits.timezone' }
      }
    }
  },
  ip: {
    type: 'string',
    required: false,
    description: 'The IP address of the user.',
    label: 'IP Address',
    default: { '@path': '$.context.ip' }
  }
}
