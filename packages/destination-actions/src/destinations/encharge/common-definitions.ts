import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

export const commonFields: ActionDefinition<Settings>['fields'] = {
  type: {
    type: 'string',
    required: true,
    description: 'The type of event.',
    label: 'Type',
    default: { '@path': '$.type' }
  },
  email: {
    type: 'string',
    required: false,
    description: 'The email address of the user.',
    label: 'Email',
    default: {
      '@if': {
        exists: { '@path': '$.context.traits.email' },
        then: { '@path': '$.context.traits.email' },
        else: { '@path': '$.properties.email' }
      }
    }
  },
  segmentAnonymousId: {
    type: 'string',
    description: 'An anonymous identifier for this user.',
    label: 'Anonymous ID',
    default: { '@path': '$.anonymousId' }
  },
  userId: {
    type: 'string',
    description: 'The User ID associated with the user in Encharge.',
    label: 'User ID',
    default: { '@path': '$.userId' }
  },
  groupId: {
    type: 'string',
    description: 'An ID associating the event with a group.',
    label: 'Group ID',
    default: { '@path': '$.context.groupId' }
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
  },
  ip: {
    type: 'string',
    required: false,
    description: 'The IP address of the user.',
    label: 'IP Address',
    default: { '@path': '$.context.ip' }
  },
  userAgent: {
    type: 'string',
    required: false,
    description: 'The user agent of the user. Used to determine the device, browser and operating system.',
    label: 'User Agent',
    default: { '@path': '$.context.userAgent' }
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
  },
  location: {
    type: 'object',
    required: false,
    description: 'Information about the location of the user.',
    label: 'Location',
    default: {
      city: { '@path': '$.context.location.city' },
      region: { '@path': '$.context.location.region' },
      country: { '@path': '$.context.location.country' }
    },
    properties: {
      city: {
        type: 'string',
        required: false,
        description: 'The city of the user.',
        label: 'City'
      },
      region: {
        type: 'string',
        required: false,
        description: 'The region of the user.',
        label: 'Region'
      },
      country: {
        type: 'string',
        required: false,
        description: 'The country of the user.',
        label: 'Country'
      }
    }
  }
}

export const userFieldsDefinition: ActionDefinition<Settings>['fields'] = {
  userFields: {
    label: 'User Fields',
    description: `Any default or custom field of the user. On the left-hand side, input the API name of the field as seen in your Encharge account. On the right-hand side, map the Segment field that contains the value. Any properties that don't exist will be created automatically. See more information in [Encharge's documentation](https://help.encharge.io/article/206-create-and-manage-custom-fields).`,
    type: 'object',
    defaultObjectUI: 'keyvalue',
    allowNull: false,
    default: { '@path': '$.context.traits' }
  }
}

export const propertiesDefinition: ActionDefinition<Settings>['fields'] = {
  properties: {
    type: 'object',
    description: 'The properties of the event.',
    label: 'Event Properties',
    default: { '@path': '$.properties' }
  }
}
