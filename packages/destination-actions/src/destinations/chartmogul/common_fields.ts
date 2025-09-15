import { InputField } from '@segment/actions-core/destination-kit/types'

export const message_id: InputField = {
  label: 'MessageId',
  description: 'The Segment message id',
  type: 'string',
  required: true,
  default: { '@path': '$.messageId' }
}

export const timestamp: InputField = {
  label: 'Event Timestamp',
  description: 'The timestamp at which the event was created',
  type: 'datetime',
  required: true,
  default: { '@path': '$.timestamp' }
}

export const sent_at: InputField = {
  label: 'Sent At',
  description: 'When the event was sent',
  type: 'datetime',
  required: true,
  default: { '@path': '$.sentAt' }
}

export const event_type: InputField = {
  label: 'Event Type',
  description: 'The type of event',
  type: 'string',
  default: 'Send ...',
  required: true,
  unsafe_hidden: true
}

export const user_id: InputField = {
  label: 'User Id',
  description: 'Segment User Id',
  type: 'string',
  readOnly: true,
  required: false,
  default: { '@path': '$.userId' }
}

export const anonymous_id: InputField = {
  label: 'Anonymous Id',
  description: 'Segment Anonymous Id',
  type: 'string',
  readOnly: true,
  required: false,
  default: { '@path': '$.anonymousId' }
}
