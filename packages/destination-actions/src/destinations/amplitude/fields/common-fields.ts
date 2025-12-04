import { InputField } from '@segment/actions-core'

export const user_id: InputField = {
    label: 'User ID',
    type: 'string',
    allowNull: true,
    description: 'A readable ID specified by you. Must have a minimum length of 5 characters. Required unless device ID is present. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event.',
    default: {
        '@path': '$.userId'
    }
}

export const common_fields = {
  user_id
}