import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  timestamp: {
    type: 'string',
    format: 'date-time',
    required: true,
    description: 'The timestamp of the event',
    label: 'Timestamp',
    default: { '@path': '$.timestamp' }
  },
  traits: {
    type: 'object',
    label: 'Traits',
    description: 'Optionally send all traits to associate with the user or the group',
    required: false,
    default: { '@path': '$.traits' }
  }
}
