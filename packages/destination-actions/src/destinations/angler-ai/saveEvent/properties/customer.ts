import { InputField, PathDirective } from '@segment/actions-core/index'

export const customerProperties: Record<string, InputField> = {
  id: {
    type: 'string',
    label: 'Customer ID',
    description: 'A unique identifier for the customer.'
  },
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
  ordersCount: {
    type: 'number',
    label: 'Orders Count',
    description: 'The number of orders associated with this customer.'
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

export function customerDefaultFields(path = ''): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return {
    id: { '@path': `${path}id` },
    email: { '@path': `${path}email` },
    firstName: { '@path': `${path}firstName` },
    lastName: { '@path': `${path}lastName` },
    ordersCount: { '@path': `${path}ordersCount` },
    phone: { '@path': `${path}phone` },
    dob: { '@path': `${path}dob` }
  }
}
