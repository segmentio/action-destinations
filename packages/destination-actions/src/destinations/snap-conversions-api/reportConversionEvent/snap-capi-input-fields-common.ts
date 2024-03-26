import { InputField } from '@segment/actions-core/destination-kit/types'

const products: InputField = {
  label: 'Products',
  description:
    "Use this field to send details of mulitple products / items. This field overrides individual 'Item ID', 'Item Category' and 'Brand' fields. Note: total purchase value is tracked using the 'Price' field",
  type: 'object',
  multiple: true,
  additionalProperties: false,
  properties: {
    item_id: {
      label: 'Item ID',
      type: 'string',
      description:
        'Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.',
      allowNull: false
    },
    item_category: {
      label: 'Category',
      type: 'string',
      description: 'Category of the item. This field accepts a string.',
      allowNull: false
    },
    brand: {
      label: 'Brand',
      type: 'string',
      description: 'Brand associated with the item. This field accepts a string.',
      allowNull: false
    }
  },
  default: {
    '@arrayPath': [
      '$.properties.products',
      {
        item_id: {
          '@path': 'product_id'
        },
        item_category: {
          '@path': 'category'
        },
        brand: {
          '@path': 'brand'
        }
      }
    ]
  }
}

const event_type: InputField = {
  label: 'Event Type',
  description:
    'The conversion event type. For custom events, you must use one of the predefined event types (i.e. CUSTOM_EVENT_1). Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).',
  type: 'string'
}

const event_conversion_type: InputField = {
  label: 'Event Conversion Type',
  description: 'Where the event took place. This must be OFFLINE, WEB, or MOBILE_APP.',
  type: 'string',
  choices: [
    { label: 'Offline', value: 'OFFLINE' },
    { label: 'Web', value: 'WEB' },
    { label: 'Mobile App', value: 'MOBILE_APP' }
  ]
}

const event_tag: InputField = {
  label: 'Event Tag',
  description: 'Custom event label.',
  type: 'string'
}

const timestamp: InputField = {
  label: 'Event Timestamp',
  description:
    'The Epoch timestamp for when the conversion happened. The timestamp cannot be more than 28 days in the past.',
  type: 'string',
  default: {
    '@path': '$.timestamp'
  }
}

const mobile_ad_id: InputField = {
  label: 'Mobile Ad Identifier',
  description:
    'Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).',
  type: 'string',
  default: {
    '@path': '$.context.device.advertisingId'
  }
}

const uuid_c1: InputField = {
  label: 'uuid_c1 Cookie',
  description:
    'Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.',
  type: 'string',
  default: {
    '@path': '$.integrations.Snap Conversions Api.uuid_c1'
  }
}

const idfv: InputField = {
  label: 'Identifier for Vendor',
  description: 'IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.',
  type: 'string',
  default: {
    '@path': '$.context.device.id'
  }
}

const price: InputField = {
  label: 'Price',
  description:
    "Total value of the purchase. This should be a single number. Can be overriden using the 'Track Purchase Value Per Product' field.",
  type: 'number',
  default: {
    '@if': {
      exists: { '@path': '$.properties.revenue' },
      then: { '@path': '$.properties.revenue' },
      else: { '@path': '$.properties.total' }
    }
  }
}

const currency: InputField = {
  label: 'Currency',
  description: 'Currency for the value specified as ISO 4217 code.',
  type: 'string',
  default: {
    '@path': '$.properties.currency'
  }
}

const transaction_id: InputField = {
  label: 'Transaction ID',
  description:
    'Transaction ID or order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Ads Kit events.',
  type: 'string',
  default: {
    '@path': '$.properties.order_id'
  }
}

const client_dedup_id: InputField = {
  label: 'Client Deduplication ID',
  description:
    'If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same client_dedup_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.',
  type: 'string'
}

const search_string: InputField = {
  label: 'Search String',
  description: 'The text string that was searched for.',
  type: 'string',
  default: {
    '@path': '$.properties.query'
  }
}

const page_url: InputField = {
  label: 'Page URL',
  description: 'The URL of the web page where the event took place.',
  type: 'string',
  default: {
    '@path': '$.context.page.url'
  }
}

const sign_up_method: InputField = {
  label: 'Sign Up Method',
  description: 'A string indicating the sign up method.',
  type: 'string'
}

const click_id: InputField = {
  label: 'Click ID',
  description:
    "The ID value stored in the landing page URL's `&ScCid=` query parameter. Using this ID improves ad measurement performance. We also encourage advertisers who are using `click_id` to pass the full url in the `page_url` field. For more details, please refer to [Sending a Click ID](#sending-a-click-id)",
  type: 'string',
  default: {
    '@path': '$.integrations.Snap Conversions Api.click_id'
  }
}

const snap_capi_input_fields_common = {
  products,
  event_type: { ...event_type, required: true },
  event_conversion_type: { ...event_conversion_type, required: true },
  event_tag,
  timestamp: { ...timestamp, required: true },
  mobile_ad_id,
  uuid_c1,
  idfv,
  price,
  currency,
  transaction_id,
  client_dedup_id,
  search_string,
  page_url,
  sign_up_method,
  click_id
}

export default snap_capi_input_fields_common
