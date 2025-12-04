import { InputField } from '@segment/actions-core'

export const global_user_id: InputField = {
    label: 'Global User ID',
    type: 'string',
    description: 'The Global User ID to associate with the User ID.',
    default: {
      '@path': '$.userId'
    }
}