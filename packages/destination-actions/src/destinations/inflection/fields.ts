import type { InputField } from '@segment/actions-core'

export const messageId: InputField = {
  label: 'Message ID',
  description: 'The unique ID of the Segment event.',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

export const timestamp: InputField = {
  label: 'Timestamp',
  description: 'The timestamp of the event.',
  type: 'datetime',
  required: true,
  default: { '@path': '$.timestamp' }
}

export const anonymousId: InputField = {
  label: 'Anonymous ID',
  description: 'The Segment anonymous ID of the user.',
  type: 'string',
  default: { '@path': '$.anonymousId' }
}

export const userId: InputField = {
  label: 'User ID',
  description: 'The unique identifier of the user.',
  type: 'string',
  required: true,
  default: { '@path': '$.userId' }
}

export const groupId: InputField = {
  label: 'Group ID',
  description: 'The unique identifier of the group the user belongs to.',
  type: 'string',
  default: { '@path': '$.context.groupId' }
}
