import { InputField } from '@segment/actions-core'

export const hookInputFields: Record<string, Omit<InputField, 'dynamic'>> = {
  audience_name: {
    type: 'string',
    label: 'The name of the Audience to create (Optional)',
    description:
      'Enter the name of the audience you want to create in Ortto. Audience names are unique for each Segment data source. If a contact profile has an Audience field explicitly set, that value will take precedence.',
    required: false
  }
}

export type HookOutputField = {
  label: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'object'
  required: boolean
}

export const hookOutputFields: Record<string, HookOutputField> = {
  audience_id: {
    type: 'string',
    label: 'ID',
    description: 'The ID of the Ortto audience to which contacts will be synced.',
    required: false
  },
  audience_name: {
    type: 'string',
    label: 'Name',
    description: 'The name of the Ortto audience to which contacts will be synced.',
    required: false
  }
}

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
        description: "The contact's phone number (including the country code is strongly recommended)",
        placeholder: '+1 555 555 5555',
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
  }
}
