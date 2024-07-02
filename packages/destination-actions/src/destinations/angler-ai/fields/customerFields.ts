import { InputField } from '@segment/actions-core/index'

export const customerFields: Record<string, InputField> = {
  customer: {
    label: 'Customer',
    type: 'object',
    description: 'Customer details',
    properties: {
      email: {
        type: 'string',
        label: 'Email',
        description: "The customer's email address."
      },
      firstName: {
        type: 'string',
        label: 'First Name',
        description: "The customer's first name."
      },
      lastName: {
        type: 'string',
        label: 'Last Name',
        description: "The customer's last name."
      },
      phone: {
        type: 'string',
        label: 'Phone',
        description: 'The unique phone number (E.164 format) for this customer.'
      },
      dob: {
        type: 'string',
        label: 'Date of Birth',
        description: "The customer's date of birth."
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
      firstName: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.context.traits.first_name' }
        }
      },
      lastName: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.context.traits.last_name' }
        }
      },
      phone: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.context.traits.phone' }
        }
      },
      dob: {
        '@if': {
          exists: { '@path': '$.traits.birthday' },
          then: { '@path': '$.traits.birthday' },
          else: { '@path': '$.context.traits.birthday' }
        }
      }
    }
  }
}
