import { InputField } from '@segment/actions-core'

export const identifyCommonFields: Record<string, InputField> = {
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
    properties: {
      city: {
        label: 'City',
        type: 'string',
        description: 'The last name of the customer.'
      },
      country: {
        label: 'Country',
        type: 'string'
      },
      zip_code: {
        label: 'Postal Code',
        type: 'string'
      },
      state: {
        label: 'State',
        type: 'string'
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
  }
}
