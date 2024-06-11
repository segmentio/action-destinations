import { InputField } from '@segment/actions-core/index'

export const customer: InputField = {
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
  }
}
