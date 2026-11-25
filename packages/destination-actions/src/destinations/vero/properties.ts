import type { InputField } from '@segment/actions-core'

export const user_id: InputField = {
  label: 'User ID',
  description: 'The unique identifier of the user in Vero. Required if no Email is provided.',
  type: 'string',
  default: { '@path': '$.userId' }
}

export const required_user_id: InputField = {
  ...user_id,
  description: 'The unique identifier of the user in Vero.',
  required: true
}

export const email: InputField = {
  label: 'Email',
  description: 'The email address of the user. Required if no User ID is provided.',
  type: 'string',
  format: 'email'
}

export const created_at: InputField = {
  label: 'Timestamp',
  description: 'When the event or change occurred. Sent to Vero as an ISO 8601 string.',
  type: 'datetime',
  default: { '@path': '$.timestamp' }
}
