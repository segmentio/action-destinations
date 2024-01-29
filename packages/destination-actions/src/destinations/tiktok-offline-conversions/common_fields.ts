import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Offline Events" section on in TikTok’s [Offline Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1758053486938113) for accepted event names.'
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
    description: 'Timestamp that the event took place, in ISO 8601 format. e.g. 2019-06-12T19:11:01.152Z',
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
    description: 'The order id',
    default: {
      '@path': '$.properties.order_id'
    }
  },
  shop_id: {
    label: 'Shop ID',
    type: 'string',
    description: 'The shop id',
    default: {
      '@path': '$.properties.shop_id'
    }
  },
  event_channel: {
    label: 'Event channel',
    type: 'string',
    description:
      'Event channel of the offline conversion event. Accepted values are: email, website, phone_call, in_store, crm, other. Any other value will be rejected',
    choices: [
      { label: 'Email', value: 'email' },
      { label: 'Website', value: 'website' },
      { label: 'Phone call', value: 'phone_call' },
      { label: 'In store', value: 'in_store' },
      { label: 'CRM', value: 'crm' },
      { label: 'Other', value: 'other' }
    ],
    default: 'in_store'
  }
}
