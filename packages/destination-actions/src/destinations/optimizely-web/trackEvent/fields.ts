import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
  uuid: {
    label: 'UUID',
    description: 'Unique message UUID to send with the event',
    type: 'string',
    required: true,
    default: { '@path': '$.messageId' }
  },
  endUserId: {
    label: 'Optimizely End User ID',
    description:
      "The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.",
    type: 'string',
    required: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.end_user_id' },
        then: { '@path': '$.properties.end_user_id' },
        else: { '@path': '$.integrations.Optimizely Web (Actions).end_user_id' }
      }
    }
  },
  anonymizeIP: {
    label: 'Anonymize IP',
    description: 'Anonymize the IP address of the user.',
    type: 'boolean',
    required: true,
    default: true,
    disabledInputMethods: ['enrichment', 'freeform', 'function', 'literal', 'variable']
  },
  eventSyncConfig: {
    label: 'Event Syncing Configuration',
    description:
      "Specify how Segment should sync Segment events to Optimizely events, as well as specify if Segment should create new Custom Events and Pages in Optimizely if they don't exist.",
    type: 'object',
    required: true,
    properties: {
      createEventIfNotFound: {
        label: 'Create If Not Found',
        description:
          'Segment can define new Custom Events in Optimizely, along with their custom properties. However once an event is defined by Segment its properties cannot be modified.',
        type: 'string',
        required: true,
        choices: [
          { label: 'Do not create', value: 'DO_NOT_CREATE' },
          { label: 'Create Custom Event', value: 'CREATE' }
        ]
      },
      shouldSnakeCaseEventKey: {
        label: 'Should Snake Case Event Key',
        description: 'If the event key should be converted to snake case before sending to Optimizely.',
        type: 'boolean',
        required: true
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
        description:
          'Optimizely event or page ID to record the event against. The ID can only be used when the event / page has already been created in Optimizely. Segment cannot create new events in Optimizely using the ID.',
        type: 'string',
        required: false
      }
    },
    default: {
      createEventIfNotFound: 'CREATE',
      shouldSnakeCaseEventKey: false,
      eventKey: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      },
      eventId: { '@path': '$.properties.event_id' }
    }
  },
  timestamp: {
    label: 'Timestamp',
    description: 'Timestamp for when the event took place',
    type: 'datetime',
    required: true,
    default: { '@path': '$.timestamp' }
  },
  tags: {
    label: 'Tags',
    description: 'Tags to send with the event',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  standardEventProperties: {
    label: 'Standard Event Properties',
    description: 'Standard event properties to send with the event.',
    type: 'object',
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      revenue: {
        label: 'Revenue',
        description:
          'The revenue amount associated with this event For example, to represent $23.42, this field would be set to 23.42.',
        type: 'number',
        required: false
      },
      value: {
        label: 'Value',
        description: 'A scalar value associated with an event. This should be some non-revenue number.',
        type: 'number',
        required: false
      },
      quantity: {
        label: 'Quantity',
        description:
          'An aggregatable "count" associated with this event; for example, a number of video views or items in a shopping cart.',
        type: 'integer',
        required: false
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
      }
    }
  },
  customStringProperties: {
    label: 'Custom Properties (string)',
    description:
      'Additional custom string event properties to send with the event. These must be defined in Optimizely before they can be sent.',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue',
    properties: {
      Category: {
        label: 'Category',
        description: 'Category of the event',
        type: 'string',
        required: false
      },
      Subcategory: {
        label: 'Subcategory',
        description: 'Subcategory of the event',
        type: 'string',
        required: false
      },
      Text: {
        label: 'Text',
        description: 'Text of the event',
        type: 'string',
        required: false
      },
      URL: {
        label: 'URL',
        description: 'URL of the event',
        type: 'string',
        required: false
      },
      SKU: {
        label: 'SKU',
        description: 'SKU of the event',
        type: 'string',
        required: false
      }
    },
    default: {
      Category: {
        '@path': '$.properties.category'
      },
      Subcategory: {
        '@path': '$.properties.subcategory'
      },
      Text: {
        '@path': '$.properties.text'
      },
      URL: {
        '@path': '$.properties.url'
      },
      SKU: {
        '@path': '$.properties.sku'
      }
    }
  },
  customNumericProperties: {
    label: 'Custom Properties (numeric)',
    description:
      'Additioanl custom numeric event properties to send with the event. These must be defined in Optimizely before they can be sent.',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  customBooleanProperties: {
    label: 'Custom Properties (boolean)',
    description:
      'Additioanl custom boolean event properties to send with the event. These must be defined in Optimizely before they can be sent.',
    type: 'object',
    required: false,
    additionalProperties: true,
    defaultObjectUI: 'keyvalue'
  },
  sessionId: {
    label: 'Session ID',
    description:
      'A unique identifier that identifies the session context, if any, for these events. If omitted, the Optimizely backend will calculate session-based results by inferring sessions by opening a session when an event is first received from a given visitor_id, and closing the session after 30 minutes with no events received for that visitor, with a maximum session size of 24 hours.',
    type: 'string',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.integrations.actions-optimizely-web.session_id' },
        then: { '@path': '$.integrations.actions-optimizely-web.session_id' },
        else: { '@path': '$.properties.session_id' }
      }
    }
  }
}
