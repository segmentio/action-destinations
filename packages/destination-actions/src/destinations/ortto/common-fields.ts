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
    default: {
      '@path': '$.userId'
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: 'Anonymous user identifier',
    type: 'string',
    default: {
      '@path': '$.anonymousId'
    }
  },
  ipV4: {
    label: 'IP Address',
    description: "The contact's IP address",
    placeholder: '180.1.12.125',
    type: 'string',
    format: 'ipv4',
    default: { '@path': '$.context.ip' },
    allowNull: true
  },
  location: {
    label: 'Location',
    description: "The contact's location. Will take priority over the IP address.",
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
      country: { '@path': '$.context.location.country' },
      city: { '@path': '$.context.location.city' }
    }
  },
  traits: {
    label: 'Custom contact traits',
    description: 'An object containing key-value pairs representing custom properties assigned to contact profile',
    type: 'object',
    defaultObjectUI: 'keyvalue',
    properties: {
      email: {
        label: 'Email',
        description: "The contact's email address",
        placeholder: 'john.smith@example.com',
        type: 'string',
        format: 'email'
      },
      phone: {
        label: 'Phone Number',
        description: "The contact's phone number",
        placeholder: '+61 159011100',
        type: 'string'
      },
      first_name: {
        label: 'First Name',
        description: "The contact's first name",
        placeholder: 'John',
        type: 'string'
      },
      last_name: {
        label: 'Last Name',
        description: "The contact's last name",
        placeholder: 'Smith',
        type: 'string'
      }
    },
    default: {
      email: { '@path': '$.traits.email' },
      phone: { '@path': '$.traits.phone' },
      first_name: { '@path': '$.traits.first_name' },
      last_name: { '@path': '$.traits.last_name' }
    }
  },
  // The Audience ID used by Segment Engage
  audience_id: {
    label: 'Audience Id',
    description: `Ortto audience ID`,
    type: 'string',
    default: {
      '@if': {
        exists: {
          '@path': '$.context.personas.audience_settings.audience_id'
        },
        then: { '@path': '$.context.personas.audience_settings.audience_id' },
        else: { '@path': '$.context.personas.external_audience_id' }
      }
    },
    unsafe_hidden: true,
    required: true
  }
}
