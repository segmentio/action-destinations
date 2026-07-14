import { InputField } from '@segment/actions-core'
import { QUORA_EVENT_NAMES, MAX_BATCH_SIZE } from './constants'

export const fields: Record<string, InputField> = {
  event_name: {
    label: 'Event Name',
    description:
      'The Quora standard conversion type. Select `Generic` to pass through the Segment event name provided in the "Segment Event Name" field.',
    type: 'string',
    required: true,
    choices: QUORA_EVENT_NAMES.map((value) => ({ label: value, value })),
    default: 'Generic'
  },
  segment_event_name: {
    label: 'Segment Event Name',
    description:
      'The raw Segment event name. Only used when Event Name is set to `Generic`, in which case this value is sent as the Quora `event_name`.',
    type: 'string',
    required: {
      conditions: [
        {
          fieldKey: 'event_name',
          operator: 'is',
          value: 'Generic'
        }
      ]
    },
    default: { '@path': '$.event' }, 
    depends_on: { 
      conditions: [
        {
          fieldKey: 'event_name',
          operator: 'is',
          value: 'Generic'
        }
      ]
    } 
  },
  timestamp: {
    label: 'Event Timestamp',
    description: 'The time the conversion occurred. Sent to Quora as epoch microseconds.',
    type: 'datetime',
    required: false,
    default: { '@path': '$.timestamp' }
  },
  click_id: {
    label: 'Click ID (qclid)',
    description:
      'The Quora click ID (`qclid`), used to attribute the conversion to a specific ad click. Required by Quora for attribution.',
    type: 'string',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.properties.qclid' },
        then: { '@path': '$.properties.qclid' },
        else: { '@path': '$.integrations.Quora Conversions API.qclid' }
      }
    }
  },
  value: {
    label: 'Value',
    description: 'The monetary value associated with the conversion. Quora requires all values to be denominated in USD.',
    type: 'number',
    required: false,
    default: {
      '@if': {
        exists: { '@path': '$.properties.revenue' },
        then: { '@path': '$.properties.revenue' },
        else: { '@path': '$.properties.total' }
      }
    }
  },
  event_id: {
    label: 'Event ID',
    description:
      'A unique identifier for the event, used to deduplicate events sent via both the Conversions API and the Quora pixel.',
    type: 'string',
    required: false,
    default: { '@path': '$.messageId' }
  },
  user: {
    label: 'User',
    description: 'User identifiers and attributes. Sent to Quora as plaintext (not hashed).',
    type: 'object',
    required: false,
    defaultObjectUI: 'keyvalue',
    additionalProperties: false,
    properties: {
      email: { label: 'Email', description: "The user's email address.", type: 'string' },
      name: { label: 'Name', description: "The user's full name.", type: 'string' },
      phone_number: {
        label: 'Phone Number',
        description: "The user's phone number. E.164 format is preferred but not enforced.",
        type: 'string'
      },
      date_of_birth: {
        label: 'Date of Birth',
        description: "The user's date of birth in ISO8601 format, for example, 2001-11-24.",
        type: 'datetime'
      },
      ip: { label: 'IP Address', description: "The user's IP address.", type: 'string' },
      country: {
        label: 'Country',
        description: "The user's country as an ISO 3166-1 alpha-2 code (e.g. US).",
        type: 'string'
      },
      region: {
        label: 'Region',
        description: "The user's state or region (e.g. California).",
        type: 'string'
      },
      city: { label: 'City', description: "The user's city.", type: 'string' },
      postal_code: { label: 'Postal Code', description: "The user's postal code.", type: 'string' }
    },
    default: {
      email: { '@path': '$.context.traits.email' },
      name: { '@path': '$.context.traits.name' },
      phone_number: { '@path': '$.context.traits.phone' },
      date_of_birth: { '@path': '$.context.traits.birthday' },
      ip: { '@path': '$.context.ip' },
      country: { '@path': '$.context.traits.address.country' },
      region: { '@path': '$.context.traits.address.state' },
      city: { '@path': '$.context.traits.address.city' },
      postal_code: { '@path': '$.context.traits.address.postalCode' }
    }
  },
  device: {
    label: 'Device',
    description: 'Device identifiers and attributes.',
    type: 'object',
    required: false,
    additionalProperties: false,
    defaultObjectUI: 'keyvalue',
    properties: {
      mobile_device_id: {
        label: 'Mobile Device ID',
        description: 'The advertising ID (IDFA on iOS, AAID on Android).',
        type: 'string'
      },
      user_agent: { label: 'User Agent', description: 'The device user agent string.', type: 'string' },
      language: {
        label: 'Language',
        description: 'The device locale string (e.g. en-US).',
        type: 'string'
      },
      referrer: {
        label: 'Referrer',
        description: 'The referring URL.',
        type: 'string'
      }
    },
    default: {
      mobile_device_id: { '@path': '$.context.device.advertisingId' },
      user_agent: { '@path': '$.context.userAgent' },
      language: { '@path': '$.context.locale' },
      referrer: { '@path': '$.context.page.referrer' }
    }
  },
  enable_batching: {
    label: 'Batch Data',
    description: 'When enabled, Segment sends events to Quora in batches.',
    type: 'boolean',
    required: false,
    default: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number',
    required: false,
    unsafe_hidden: true,
    default: MAX_BATCH_SIZE,
    maximum: MAX_BATCH_SIZE
  }
}
