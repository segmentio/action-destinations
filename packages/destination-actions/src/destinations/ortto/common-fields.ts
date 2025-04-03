import { InputField } from '@segment/actions-core'
import { audience_id } from '../tiktok-audiences/properties'

export const commonFields: Record<string, InputField> = {
  timestamp: {
    label: 'Timestamp',
    description: 'Event timestamp',
    type: 'string',
    readOnly: true,
    format: 'date-time',
    default: {
      '@path': '$.timestamp'
    }
  },
  message_id: {
    label: 'Message ID',
    description: 'Message ID',
    type: 'string',
    readOnly: true,
    default: {
      '@path': '$.messageId'
    }
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch data',
    description: 'When enabled, events will be sent to Ortto in batches for improved efficiency.',
    default: true
  },
  user_id: {
    label: 'User ID',
    description: 'The unique user identifier',
    type: 'string',
    default: {
      '@path': '$.userId'
    }
  },
  anonymous_id: {
    label: 'Anonymous ID',
    description: 'Anonymous user identifier',
    type: 'string',
    default: {
      '@path': '$.anonymousId'
    }
  },
  audience_id: {
    label: 'Audience',
    description: `The Audience to add the contact profile to.`,
    type: 'string',
    dynamic: true
  }
}
