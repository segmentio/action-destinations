import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Offline Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description:
      'A unique value for each event. This ID can be used to match data between partner and TikTok. We suggest it is a String of 32 characters, including numeric digits (0-9), uppercase letters (A-Z), and lowercase letters (a-z).',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    type: 'string',
    required: true,
    description: 'Timestamp that the event took place, in ISO 8601 format.',
    default: {
      '@path': '$.timestamp'
    }
  },
  phone_numbers: {
    label: 'Phone Numbers',
    description:
      'A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number is required if no value is provided in the Emails field.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.traits.phone' }
      }
    }
  },
  email_addresses: {
    label: 'Emails',
    description:
      'A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email is required if no value is provided in the Phone Numbers field.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.traits.email' }
      }
    }
  },
  order_id: {
    label: 'Order ID',
    type: 'string',
    description: 'A string description of the web event.',
    default: {
      '@path': '$.properties.order_id'
    }
  },
  shop_id: {
    label: 'Shop ID',
    type: 'string',
    description: 'The text string that was searched for.',
    default: {
      '@path': '$.properties.shop_id'
    }
  },
  event_channel: {
    label: 'Event channel',
    type: 'string',
    description:
      'Event channel of the offline conversion event. Accepted values are: email, website, phone_call, in_store, crm, other',
    default: {
      '@path': '$.properties.event_channel'
    }
  }
}
