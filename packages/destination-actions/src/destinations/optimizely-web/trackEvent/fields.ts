import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  endUserId: {
    label: 'Optimizely End User ID',
    description:
      "The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.",
    type: 'string',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.integrations.actions-optimizely-web.end_user_id' },
        then: { '@path': '$.integrations.actions-optimizely-web.end_user_id' },
        else: { '@path': '$.properties.end_user_id' }
      }
    }
  },
  projectID: {
    label: 'Optimizely Project ID',
    description: 'The unique identifier for the project.',
    type: 'string',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.integrations.actions-optimizely-web.project_id' },
        then: { '@path': '$.integrations.actions-optimizely-web.project_id' },
        else: { '@path': '$.properties.project_id' }
      }
    }
  },
  anonymizeIP: {
    label: 'Anonymize IP',
    description: 'Anonymize the IP address of the user.',
    type: 'boolean',
    required: true,
    default: true
  },
  eventMatching: {
    label: 'Event Matching',
    description: "Specify how Segment should match the Segment event to an Optimizely event, as well as specify if Segment should create new Custom Events and Pages in Optimizely if they don't exist.",
    type: 'object',
    required: true,
    properties: {
      createEventIfNotFound: {
        label: 'Create If Not Found',
        description: 'If needed, Segment can define new Custom Events and Pages in Optimizely. If you do not want Segment to create new events, select "Do not create".',
        type: 'string',
        required: true,
        choices: [
          { label: 'Do not create', value: 'DO_NOT_CREATE' },
          { label: 'Create Custom Event', value: 'CREATE' }
        ]
      },
      eventName: {
        label: 'Event Name',
        description: "Optimizely event or page name to record the event against.",
        type: 'string',
        required: false,
        default: { '@path': '$.event' }
      },
      eventKey: {
        label: 'Event Key',
        description: 'Optimizely event or page key to record the event against.',
        type: 'string',
        required: false,
        default: { '@path': '$.event' }
      },
      eventId: {
        label: 'Event ID',
        description: 'Optimizely event or page ID to record the event against. The ID can only be used when the event / page has already been created in Optimizely. Segment cannot create new events in Optimizely using the ID.',
        type: 'string',
        required: false
      },
    },
    default: {
      createEventIfNotFound: 'CREATE'
    }
  },
  pageUrl: {
    label: 'Page URL',
    description: 'The URL of the page where the event occurred.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.page.url' }
  },
  category: {
    label: 'Event Category',
    description: 'Event Category',
    type: 'string',
    required: true,
    choices: [
      { label: 'add_to_cart', value: 'add_to_cart' },
      { label: 'save', value: 'save' },
      { label: 'search', value: 'search' },
      { label: 'share', value: 'share' },
      { label: 'purchase', value: 'purchase' },
      { label: 'convert', value: 'convert' },
      { label: 'sign_up', value: 'sign_up' },
      { label: 'subscribe', value: 'subscribe' },
      { label: 'other', value: 'other' }
    ],
    default: 'other'
  },
  timestamp: {
    label: 'Timestamp',
    description: 'Timestampt for when the event took place',
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
  },
  uuid: {
    label: 'UUID',
    description: 'Unique message UUID to send with the event',
    type: 'string',
    required: true,
    default: { '@path': '$.messageId' }
  },
  eventType: {
    label: 'Event Type',
    description: 'The type of Segment event',
    type: 'string',
    unsafe_hidden: true,
    required: true,
    default: { '@path': '$.type' }
  },
  tags: {
    label: 'Tags',
    description: 'Tags to send with the event',
    type: 'object',
    required: false,
    additionalProperties: true,
    properties: {
      revenue: {
        label: 'Revenue',
        description: 'The currency amount associated with the event. For example for $20.05 USD send 20.05',
        type: 'number',
        required: false
      },
      value: {
        label: 'Value',
        description: 'Value associated with the event.',
        type: 'number',
        required: false
      },
      quantity: {
        label: 'Quantity',
        description: 'The quantity of items associated with the event.',
        type: 'integer',
        required: false
      },
      currency: {
        label: 'Currency',
        description: 'Currency code for revenue. Defaults to USD.',
        type: 'string',
        required: false,
        default: 'USD'
      }
    },
    default: {
      revenue: {
        '@path': '$.properties.revenue'
      },
      value: {
        '@path': '$.properties.value'
      },
      quantity: {
        '@path': '$.properties.quantity'
      },
      currency: {
        '@path': '$.properties.currency'
      }
    }
  },
  properties: {
    label: 'Properties',
    description: 'Additional properties to send with the event.',
    type: 'object',
    required: false,
    default: { '@path': '$.properties' }
  }
}
