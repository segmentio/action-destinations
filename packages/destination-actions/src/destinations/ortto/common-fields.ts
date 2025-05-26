import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  timestamp: {
    label: 'Timestamp',
    description: 'Event timestamp',
    type: 'string',
    readOnly: true,
    format: 'date-time',
    default: {
      '@path': '$.timestamp'
    }
  },
  message_id: {
    label: 'Message ID',
    description: 'Message ID',
    type: 'string',
    readOnly: true,
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
    properties: {
      email: {
        label: 'Email',
        description: "The Contact's email address",
        placeholder: 'john.smith@example.com',
        type: 'string',
        format: 'email'
      },
      phone: {
        label: 'Phone Number',
        description: "The Contact's phone number (including the country code is strongly recommended)",
        placeholder: '+15555555555',
        type: 'string'
      },
      first_name: {
        label: 'First Name',
        description: "The Contact's first name",
        placeholder: 'John',
        type: 'string'
      },
      last_name: {
        label: 'Last Name',
        description: "The Contact's last name",
        placeholder: 'Smith',
        type: 'string'
      }
    },
    default: {
      email: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      },
      phone: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      },
      first_name: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.context.traits.first_name' }
        }
      },
      last_name: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.context.traits.last_name' }
        }
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
