import { InputField } from '@segment/actions-core'

export const commonFields: Record<string, InputField> = {
  event: {
    label: 'Event Name',
    type: 'string',
    required: true,
    description:
      'Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Pixel SDK documentation](https://business-api.tiktok.com/portal/docs?id=1739585696931842) for accepted event names.'
  },
  event_id: {
    label: 'Event ID',
    type: 'string',
    description: 'Any hashed ID that can identify a unique user/session.',
    default: {
      '@path': '$.messageId'
    }
  },
  phone_number: {
    label: 'Phone Number',
    description:
      'A single phone number in E.164 standard format. TikTok Pixel will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.',
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
    description: 'A single email address. TikTok Pixel will be hash this value before sending to TikTok.',
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
      'Uniquely identifies the user who triggered the conversion event. TikTok Pixel will hash this value before sending to TikTok.',
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
  }
}
