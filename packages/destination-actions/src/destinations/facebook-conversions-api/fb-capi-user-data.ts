import { InputField } from '@segment/actions-core/src/destination-kit/types'

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters

export const user_data: InputField = {
  label: 'User Data',
  description: 'User Data',
  type: 'object',
  properties: {
    email: {
      label: 'Email',
      description: 'User Email',
      type: 'string'
    },
    phone: {
      label: 'Phone',
      description: 'User phone number',
      type: 'string'
    },
    gender: {
      label: 'Gender',
      description: 'User gender',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description: 'Client User Agent',
      type: 'string'
    }
  }
}
