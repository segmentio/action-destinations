import { InputField } from '@segment/actions-core/destination-kit/types'

export const eventName: InputField = {
  label: 'Event Name',
  description: 'The name of the event to send to Epsilon.',
  type: 'string',
  required: true,
  default: {
    '@path': '$.event'
  }
}

export const formId: InputField = {
  label: 'Form ID',
  description: 'Form ID used in Epsilon’s system to identify app visits vs. conversions.',
  type: 'string',
  required: true
} 

export const identifiers: InputField = {
  label: 'Identifiers',
  description: 'Unique identifiers for the user.',
  type: 'object',
  required: true,
  properties: {
    emailHash: {
      label: 'Email address',
      description: 'Accepts hashed or unhashed emails. Segment will ensure that a non hashed email is hashed before being sent to Epsilon',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    userAgent: {
      label: 'User Agent',
      description: 'User agent of the mobile device.',
      type: 'string',
      default: { '@path': '$.context.userAgent' }
    },
    userIp: {
      label: 'IP Address',
      description: 'IP address of the user.',
      type: 'string',
      default: { '@path': '$.context.ip' }
    },
    userId: {
      label: 'User ID',
      description: 'Unique identifier for the user.',
      type: 'string',
      default: { '@path': '$.userId' }
    },
    dvcid: {
      label: 'Device ID',
      description: 'Unique identifier for the device.',
      type: 'string',
      default: { '@path': '$.context.device.id' }
    }
  }
}

export const cachebuster: InputField = {
  label: 'Cache Buster',
  description: 'Unique identifier for the message. Used for cache busting.',
  type: 'string',
  default: { '@path': '$.messageId' }
}