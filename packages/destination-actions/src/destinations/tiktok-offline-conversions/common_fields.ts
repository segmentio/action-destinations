import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Offline Standard Events" section on in TikTok’s [Events API 2.0 documentation](https://business-api.tiktok.com/portal/docs?id=1771101186666498) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description: '<TODO>',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    type: 'string',
    description: 'Timestamp for when the event took place. In ISO 8601 format.',
    default: {
      '@path': '$.timestamp'
    }
  },
  phone_numbers: {
    label: 'Phone Numbers',
    description:
      'A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number is required if the Emails and External IDs fields are both empty.',
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
      'A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email is required if the Phone Numbers and External IDs fields are both empty.',
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
  external_ids: {
    label: 'External ID',
    description:
      'Unique ID or array of IDs for a user. Segment will hash this value before sending to TikTok. At least one external Id is required if the Phone Numbers and Emails fields are both empty.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  ttclid: {
    label: 'TikTok Click ID',
    description:
      'The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](<TODO>) for details.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.integrations.TikTok Pixel.ttclid' },
        then: { '@path': '$.integrations.TikTok Pixel.ttclid' },
        else: { '@path': '$.properties.ttclid' }
      }
    }
  },
  ttp: {
    label: 'TikTok Cookie ID',
    description:
      'If the Pixel SDK is being used and cookies are enabled, the Pixel SDK saves a unique identifier in the `_ttp` cookie and can be used to improve the match rate. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](<TODO>) (`_ttp`).',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.integrations.TikTok Pixel.ttp' },
        then: { '@path': '$.integrations.TikTok Pixel.ttp' },
        else: { '@path': '$.properties.ttp' }
      }
    }
  },
  lead_id: {
    label: 'TikTok Lead ID',
    description:
      'ID of TikTok leads. This feature is in beta - please enquire with your TikTok representative for more information.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.lead_id' },
        then: { '@path': '$.properties.lead_id' },
        else: { '@path': '$.traits.lead_id' }
      }
    }
  },
  locale: {
    label: 'Locale',
    description:
      'The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).',
    type: 'string',
    default: {
      '@path': '$.context.locale'
    }
  },
  url: {
    label: 'Page URL',
    type: 'string',
    description: 'The page URL where the conversion event took place.',
    default: {
      '@path': '$.context.page.url'
    }
  },
  referrer: {
    label: 'Page Referrer',
    type: 'string',
    description: 'The page referrer.',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  ip: {
    label: 'IP Address',
    type: 'string',
    description: 'IP address of the browser.',
    default: {
      '@path': '$.context.ip'
    }
  },
  user_agent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent from the user’s device.',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  description: {
    label: 'Description',
    type: 'string',
    description: 'Any additional information regarding the Offline Event.'
  },
  query: {
    label: 'Query',
    type: 'string',
    description: 'The text string that was searched for.',
    default: {
      '@path': '$.properties.query'
    }
  },
  order_id: {
    label: 'Order ID',
    type: 'string',
    description: 'Order ID of the transaction.',
    default: {
      '@path': '$.properties.order_id'
    }
  },
  shop_id: {
    label: 'Shop ID',
    type: 'string',
    description: 'Shop ID of the transaction.',
    default: {
      '@path': '$.properties.shop_id'
    }
  },
  limited_data_use: {
    label: 'Limited Data Use',
    type: 'boolean',
    description:
      'If set to true, flags an event for limited data processing. See [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).',
    default: {
      '@path': '$.properties.limited_data_use'
    }
  },
  test_event_code: {
    label: 'Test Event Code',
    type: 'string',
    description:
      'Marks the event as a test event. The Test Event Code can be found in the TikTok Events Manager under the "Test Event" tab. Remove the code before sending Production traffic.'
  }
}
