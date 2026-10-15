import type { InputField } from '@segment/actions-core'
import { ARRAY_HANDLING, OBJECT_HANDLING } from './constants'

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

export const nestedValueHandling: InputField = {
  label: 'Nested Value Handling',
  description: 'How to send objects and arrays nested inside the properties or traits.',
  type: 'object',
  defaultObjectUI: 'object',
  additionalProperties: false,
  properties: {
    objectHandling: {
      label: 'Object Handling',
      description:
        'Stringify sends the object as a JSON string. Flatten sends one field per key, named parent_key (for example address_city).',
      type: 'string',
      choices: [
        { label: 'Stringify as JSON', value: OBJECT_HANDLING.STRINGIFY },
        { label: 'Flatten into separate fields', value: OBJECT_HANDLING.FLATTEN }
      ],
      default: OBJECT_HANDLING.STRINGIFY
    },
    arrayHandling: {
      label: 'Array Handling',
      description:
        'Stringify sends the array as a JSON string. Flatten sends one field per item, named parent_0, parent_1. Join sends a single comma-separated string.',
      type: 'string',
      choices: [
        { label: 'Stringify as JSON', value: ARRAY_HANDLING.STRINGIFY },
        { label: 'Flatten into separate fields', value: ARRAY_HANDLING.FLATTEN },
        { label: 'Join into a comma-separated string', value: ARRAY_HANDLING.JOIN }
      ],
      default: ARRAY_HANDLING.STRINGIFY
    }
  },
  default: {
    objectHandling: OBJECT_HANDLING.STRINGIFY,
    arrayHandling: ARRAY_HANDLING.STRINGIFY
  }
}
