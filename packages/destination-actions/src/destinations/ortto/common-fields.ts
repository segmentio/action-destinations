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
  geo_mode: {
    label: 'Geolocation mode',
    description: "Specifies how to assign the contact's location",
    default: 'none',
    type: 'string',
    choices: [
      { label: 'IP Address', value: 'ip' },
      { label: 'Location', value: 'location' },
      { label: 'None', value: 'none' }
    ]
  },
  ip: {
    label: 'IP Address',
    description: "The contact's IP address",
    placeholder: '180.1.12.125',
    type: 'string',
    format: 'ipv4',
    default: { '@path': '$.context.ip' },
    allowNull: true,
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'geo_mode',
          operator: 'is',
          value: 'ip'
        }
      ]
    }
  },
  location: {
    label: 'Location',
    description: "The contact's location",
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
    },
    depends_on: {
      match: 'all',
      conditions: [
        {
          fieldKey: 'geo_mode',
          operator: 'is',
          value: 'location'
        }
      ]
    }
  }
}
