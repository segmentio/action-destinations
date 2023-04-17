import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../encharge/generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
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
    label: 'Referer',
    default: { '@path': '$.context.page.referrer' }
  },
  url: {
    type: 'string',
    required: false,
    description: 'The URL of the page where the event occurred.',
    label: 'URL',
    default: { '@path': '$.context.page.url' }
  },
  user: {
    type: 'object',
    required: true,
    description: 'Information about the user.',
    label: 'User',
    defaultObjectUI: 'keyvalue',
    properties: {
      id: {
        label: 'User ID',
        type: 'string',
        required: true
      },
      email: {
        label: 'User email',
        type: 'string',
        required: true
      },
      anonymous_id: {
        label: 'User anonymous ID',
        type: 'string'
      },
      first_name: {
        label: 'User first name',
        type: 'string'
      },
      last_name: {
        label: 'User last name',
        type: 'string'
      },
      created_at: {
        label: 'User created At',
        type: 'string',
        required: false
      },
      custom: {
        label: 'User custom attributes',
        type: 'object',
        required: false
      }
    },
    default: {
      id: { '@path': '$.userId' },
      email: { '@path': '$.email' },
      anonymous_id: { '@path': '$.anonymousId' },
      first_name: { '@path': '$.traits.firstName' },
      last_name: { '@path': '$.traits.lastName' },
      created_at: { '@path': '$.traits.created_at' }
    }
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
        type: 'string'
      },
      medium: {
        label: 'Medium',
        type: 'string'
      },
      name: {
        label: 'Name',
        type: 'string'
      },
      term: {
        label: 'Term',
        type: 'string'
      },
      content: {
        label: 'Content',
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
        type: 'integer'
      },
      width: {
        label: 'Width',
        type: 'integer'
      },
      density: {
        label: 'Density',
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
