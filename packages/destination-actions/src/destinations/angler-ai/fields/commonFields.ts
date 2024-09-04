import type { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  eventId: {
    label: 'Event ID',
    type: 'string',
    description: 'A unique event identifier.',
    required: true,
    default: {
      '@path': '$.messageId'
    }
  },
  ipAddress: {
    label: 'IP Address',
    type: 'string',
    description: 'The IP address of the user.',
    default: {
      '@path': '$.context.ip'
    }
  },
  userAgent: {
    label: 'User Agent',
    type: 'string',
    description: 'The user agent of the device sending the event.',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  timestamp: {
    label: 'Timestamp',
    type: 'string',
    description: 'The timestamp when the event was triggered.',
    default: {
      '@path': '$.timestamp'
    }
  },
  identifiers: {
    label: 'Identifiers',
    type: 'object',
    description: 'Identifiers for the user',
    required: true,
    additionalProperties: true,
    properties: {
      userId: {
        label: 'Segment user ID',
        type: 'string',
        description: 'Segment User ID.'
      },
      anonymousId: {
        label: 'Segment anonymous ID',
        type: 'string',
        description: 'Segment anonymous ID.'
      },
      clientId: {
        label: 'Client ID',
        type: 'string',
        description: 'Client ID.',
        required: true
      },
      fbp: {
        label: 'Facebook Pixel ID',
        type: 'string',
        description: 'Facebook Pixel ID. This is a cookie which is unique to each user.'
      },
      fbc: {
        label: 'Facebook Click ID',
        type: 'string',
        description: 'Facebook Click ID. This is a cookie which is unique to each user.'
      },
      ga: {
        label: 'Google Analytics ID',
        type: 'string',
        description: 'Google Analytics ID. This is a cookie which is unique to each user.'
      }
    },
    default: {
      userId: { '@path': '$.userId' },
      anonymousId: { '@path': '$.anonymousId' },
      clientId: { '@path': '$.anonymousId' },
      fbp: { '@path': '$.properties.fbp' },
      fbc: { '@path': '$.properties.fbc' },
      ga: { '@path': '$.properties.ga' }
    }
  },
  page: {
    label: 'Page',
    type: 'object',
    description: 'Page details to send with the event',
    properties: {
      url: {
        label: 'URL',
        type: 'string',
        description: 'The URL where the event occurred.'
      },
      referrer: {
        label: 'Referrer',
        type: 'string',
        description: 'The referring URL if applicable.'
      }
    },
    additionalProperties: false,
    default: {
      url: { '@path': '$.context.page.url' },
      referrer: { '@path': '$.context.page.referrer' }
    }
  },
  customAttributes: {
    label: 'Custom Attributes',
    type: 'object',
    description: 'Custom attributes for the event. Data should be specified as key:value pairs',
    additionalProperties: true
  }
}
