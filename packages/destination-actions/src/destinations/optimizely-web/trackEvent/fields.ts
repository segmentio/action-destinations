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
  createEventIfNotFound: {
    label: 'Create Custom Event',
    description: "Segment will create a new Custom Event in Optimizely if the Custom Event doesn't already exist.",
    type: 'string',
    choices: [
      { label: 'Do not create', value: 'DO_NOT_CREATE' },
      { label: 'Create Custom Event', value: 'CREATE' },
      { label: 'Create Custom Event - snake_case', value: 'CREATE_SNAKE_CASE' }
    ],
    required: true,
    default: 'CREATE'
  },
  eventName: {
    label: 'Event Name',
    description: 'Event Name.',
    type: 'string',
    required: true,
    default: { '@path': '$.event' }
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
