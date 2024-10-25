import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description: 'Any hashed ID that can identify a unique user/session.',
    default: {
      '@path': '$.messageId'
    }
  },
  timestamp: {
    label: 'Event Timestamp',
    type: 'string',
    description: 'Timestamp that the event took place, in ISO 8601 format.',
    default: {
      '@path': '$.timestamp'
    }
  },
  phone_number: {
    label: 'Phone Number',
    description:
      'A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.phone' },
        then: { '@path': '$.properties.phone' },
        else: { '@path': '$.context.traits.phone' }
      }
    }
  },
  email: {
    label: 'Email',
    description:
      'A single email address or an array of email addresses. Segment will hash this value before sending to TikTok.',
    type: 'string',
    multiple: true,
    default: {
      '@if': {
        exists: { '@path': '$.properties.email' },
        then: { '@path': '$.properties.email' },
        else: { '@path': '$.context.traits.email' }
      }
    }
  },
  first_name: {
    label: 'First Name',
    description:
      'The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.first_name' },
        then: { '@path': '$.properties.first_name' },
        else: { '@path': '$.context.traits.first_name' }
      }
    }
  },
  last_name: {
    label: 'Last Name',
    description:
      'The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.last_name' },
        then: { '@path': '$.properties.last_name' },
        else: { '@path': '$.context.traits.last_name' }
      }
    }
  },
  address: {
    label: 'Address',
    type: 'object',
    description: 'The address of the customer.',
    additionalProperties: false,
    properties: {
      city: {
        label: 'City',
        type: 'string',
        description: "The customer's city."
      },
      country: {
        label: 'Country',
        type: 'string',
        description: "The customer's country."
      },
      zip_code: {
        label: 'Zip Code',
        type: 'string',
        description: "The customer's Zip Code."
      },
      state: {
        label: 'State',
        type: 'string',
        description: "The customer's State."
      }
    },
    default: {
      city: {
        '@if': {
          exists: { '@path': '$.properties.address.city' },
          then: { '@path': '$.properties.address.city' },
          else: { '@path': '$.context.traits.address.city' }
        }
      },
      country: {
        '@if': {
          exists: { '@path': '$.properties.address.country' },
          then: { '@path': '$.properties.address.country' },
          else: { '@path': '$.context.traits.address.country' }
        }
      },
      zip_code: {
        '@if': {
          exists: { '@path': '$.properties.address.postal_code' },
          then: { '@path': '$.properties.address.postal_code' },
          else: { '@path': '$.context.traits.address.postal_code' }
        }
      },
      state: {
        '@if': {
          exists: { '@path': '$.properties.address.state' },
          then: { '@path': '$.properties.address.state' },
          else: { '@path': '$.context.traits.address.state' }
        }
      }
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
  external_id: {
    label: 'External ID',
    description:
      'Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Conversions Destination supports both string and string[] types for sending external ID(s).',
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
      'The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.ttclid' },
        then: { '@path': '$.properties.ttclid' },
        else: { '@path': '$.integrations.TikTok Conversions.ttclid' }
      }
    }
  },
  ttp: {
    label: 'TikTok Cookie ID',
    description:
      'TikTok Cookie ID. If you also use Pixel SDK and have enabled cookies, Pixel SDK automatically saves a unique identifier in the `_ttp` cookie. The value of `_ttp` is used to match website visitor events with TikTok ads. You can extract the value of `_ttp` and attach the value here. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](https://ads.tiktok.com/marketing_api/docs?id=%201771100936446977) (`_ttp`).',
    type: 'string',
    default: {
      '@if': {
        exists: { '@path': '$.properties.ttp' },
        then: { '@path': '$.properties.ttp' },
        else: { '@path': '$.integrations.TikTok Conversions.ttp' }
      }
    }
  },
  lead_id: {
    label: 'TikTok Lead ID',
    description:
      'ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability',
    type: 'string',
    default: { '@path': '$.properties.lead_id' }
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
  contents: {
    label: 'Contents',
    type: 'object',
    multiple: true,
    description: 'Related item details for the event.',
    properties: {
      price: {
        label: 'Price',
        description: 'Price of the item.',
        type: 'number'
      },
      quantity: {
        label: 'Quantity',
        description: 'Number of items.',
        type: 'number'
      },
      content_category: {
        label: 'Content Category',
        description: 'Category of the product item.',
        type: 'string'
      },
      content_id: {
        label: 'Content ID',
        description: 'ID of the product item.',
        type: 'string'
      },
      content_name: {
        label: 'Content Name',
        description: 'Name of the product item.',
        type: 'string'
      },
      brand: {
        label: 'Brand',
        description: 'Brand name of the product item.',
        type: 'string'
      }
    }
  },
  content_type: {
    label: 'Content Type',
    description:
      'Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.',
    type: 'string',
    choices: [
      { label: 'product', value: 'product' },
      { label: 'product_group', value: 'product_group' }
    ],
    default: 'product'
  },
  currency: {
    label: 'Currency',
    type: 'string',
    description: 'Currency for the value specified as ISO 4217 code.',
    default: {
      '@path': '$.properties.currency'
    }
  },
  value: {
    label: 'Value',
    type: 'number',
    description: 'Value of the order or items sold.',
    default: {
      '@if': {
        exists: { '@path': '$.properties.value' },
        then: { '@path': '$.properties.value' },
        else: { '@path': '$.properties.revenue' }
      }
    }
  },
  description: {
    label: 'Description',
    type: 'string',
    description: 'A string description of the web event.'
  },
  query: {
    label: 'Query',
    type: 'string',
    description: 'The text string that was searched for.',
    default: {
      '@path': '$.properties.query'
    }
  },
  limited_data_use: {
    label: 'Limited Data Use',
    type: 'boolean',
    description:
      'Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).',
    default: {
      '@path': '$.properties.limited_data_use'
    }
  },
  test_event_code: {
    label: 'Test Event Code',
    type: 'string',
    description:
      'Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You\'ll want to remove your Test Event Code when sending real traffic through this integration.'
  }
}
