import { InputField } from '@segment/actions-core'

export const common_fields: Record<string, InputField> = {
  phone_number: {
    label: 'Phone Number',
    description:
      'A single phone number in E.164 standard format. TikTok Pixel will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.context.traits.phone' }
      }
    }
  },
  email: {
    label: 'Email',
    description: 'A single email address. TikTok Pixel will be hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.context.traits.email' }
      }
    }
  },
  first_name: {
    label: 'First Name',
    description:
      'The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.first_name' },
        then: { '@path': '$.properties.first_name' },
        else: { '@path': '$.context.traits.first_name' }
      }
    }
  },
  last_name: {
    label: 'Last Name',
    description:
      'The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.last_name' },
        then: { '@path': '$.properties.last_name' },
        else: { '@path': '$.context.traits.last_name' }
      }
    }
  },
  address: {
    label: 'Address',
    type: 'object',
    description: 'The address of the customer.',
    additionalProperties: false,
    properties: {
      city: {
        label: 'City',
        type: 'string',
        description: "The customer's city."
      },
      country: {
        label: 'Country',
        type: 'string',
        description: "The customer's country."
      },
      zip_code: {
        label: 'Zip Code',
        type: 'string',
        description: "The customer's Zip Code."
      },
      state: {
        label: 'State',
        type: 'string',
        description: "The customer's State."
      }
    },
    default: {
      city: {
        '@if': {
          exists: { '@path': '$.properties.address.city' },
          then: { '@path': '$.properties.address.city' },
          else: { '@path': '$.context.traits.address.city' }
        }
      },
      country: {
        '@if': {
          exists: { '@path': '$.properties.address.country' },
          then: { '@path': '$.properties.address.country' },
          else: { '@path': '$.context.traits.address.country' }
        }
      },
      zip_code: {
        '@if': {
          exists: { '@path': '$.properties.address.postal_code' },
          then: { '@path': '$.properties.address.postal_code' },
          else: { '@path': '$.context.traits.address.postal_code' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.properties.address.state' },
          then: { '@path': '$.properties.address.state' },
          else: { '@path': '$.context.traits.address.state' }
        }
      }
    }
  },
  external_id: {
    label: 'External ID',
    description:
      'Uniquely identifies the user who triggered the conversion event. TikTok Pixel will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  }
}
