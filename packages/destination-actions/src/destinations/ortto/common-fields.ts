import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  timestamp: {
    label: 'Timestamp',
    description: 'Event timestamp (ISO 8601)',
    type: 'string',
    readOnly: true,
    format: 'date-time',
    required: true,
    default: {
      '@path': '$.timestamp'
    }
  },
  message_id: {
    label: 'Message ID',
    description: 'Message ID',
    type: 'string',
    readOnly: true,
    required: true,
    default: {
      '@path': '$.messageId'
    }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch data',
    description: 'When enabled, events will be sent to Ortto in batches for improved efficiency.',
    default: true
  },
  user_id: {
    label: 'User ID',
    description: 'The unique user identifier',
    type: 'string',
    required: {
      conditions: [
        {
          fieldKey: 'anonymous_id',
          operator: 'is',
          value: undefined
        }
      ]
    },
    default: {
      '@path': '$.userId'
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: 'Anonymous user identifier',
    type: 'string',
    required: {
      conditions: [
        {
          fieldKey: 'user_id',
          operator: 'is',
          value: undefined
        }
      ]
    },
    default: {
      '@path': '$.anonymousId'
    }
  },
  ipV4: {
    label: 'IP Address',
    description: "The Contact's IP address",
    placeholder: '180.1.12.125',
    type: 'string',
    format: 'ipv4',
    default: { '@path': '$.context.ip' },
    allowNull: true
  },
  location: {
    label: 'Location',
    description: "The Contact's location. Takes priority over the IP address.",
    type: 'object',
    defaultObjectUI: 'keyvalue:only',
    additionalProperties: false,
    allowNull: true,
    properties: {
      country: {
        label: 'Country',
        type: 'string',
        allowNull: true
      },
      state: {
        label: 'State',
        type: 'string',
        allowNull: true
      },
      city: {
        label: 'City',
        type: 'string',
        allowNull: true
      },
      post_code: {
        label: 'Postcode',
        type: 'string',
        allowNull: true
      }
    },
    default: {
      country: {
        '@if': {
          exists: { '@path': '$.traits.address.country' },
          then: { '@path': '$.traits.address.country' },
          else: { '@path': '$.context.traits.address.country' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.traits.address.state' },
          then: { '@path': '$.traits.address.state' },
          else: { '@path': '$.context.traits.address.state' }
        }
      },
      city: {
        '@if': {
          exists: { '@path': '$.traits.address.city' },
          then: { '@path': '$.traits.address.city' },
          else: { '@path': '$.context.traits.address.city' }
        }
      },
      post_code: {
        '@if': {
          exists: { '@path': '$.traits.address.postal_code' },
          then: { '@path': '$.traits.address.postal_code' },
          else: { '@path': '$.context.traits.address.postal_code' }
        }
      }
    }
  },
  traits: {
    label: 'Custom Contact traits',
    description: 'An object containing key-value pairs representing custom properties assigned to Contact profile',
    type: 'object',
    defaultObjectUI: 'keyvalue',
    default: {
      '@if': {
        exists: { '@path': '$.traits' },
        then: { '@path': '$.traits' },
        else: { '@path': '$.context.traits' }
      }
    }
  },
  audience_update_mode: {
    label: 'Audience update mode',
    description: 'Indicates whether the Contact should be added to or removed from the Audience.',
    type: 'string',
    required: false,
    choices: [
      { label: 'Add', value: 'add' },
      { label: 'Remove', value: 'remove' }
    ],
    default: 'add'
  },
  // Hidden Fields
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch.',
    type: 'number',
    required: false,
    default: 500,
    readOnly: true,
    unsafe_hidden: true
  }
}
