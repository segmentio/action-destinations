import { InputField } from '@segment/actions-core/destination-kit/types'

const brands: InputField = {
  label: '[Deprecated] Brand',
  // FIXME
  description: 'Brand associated with the item. This field accepts a string or a list of strings',
  type: 'string',
  multiple: true,
  default: {
    '@path': '$.properties.brand'
  }
}

const click_id: InputField = {
  label: '[Deprecated] Click ID',
  description: 'Deprecated. Use user_data.sc_click_id',
  type: 'string'
}

const client_dedup_id: InputField = {
  label: '[Deprecated] Client Deduplication ID',
  description: 'Deprecated. Use event_id',
  type: 'string'
}

const currency: InputField = {
  label: '[Deprecated] Currency',
  description: 'Deprecated. Use custom_data.currency',
  type: 'string'
}

const description: InputField = {
  label: '[Deprecated] Description',
  description: 'Deprecated. No longer supported.',
  type: 'string'
}

const device_model: InputField = {
  label: '[Deprecated] Device Model',
  description: 'Deprecated. Use app_data.deviceName',
  type: 'string'
}

const email: InputField = {
  label: '[Deprecated] Email',
  description: 'Deprecated. Use user_data.email',
  type: 'string'
}

const event_conversion_type: InputField = {
  label: '[Deprecated] Event Conversion Type',
  description: 'Deprecated. Use action_source.',
  type: 'string',
  choices: [
    { label: 'Offline', value: 'OFFLINE' },
    { label: 'Web', value: 'WEB' },
    { label: 'Mobile App', value: 'MOBILE_APP' }
  ]
}

const event_tag: InputField = {
  label: '[Deprecated] Event Tag',
  description: 'Deprecated. No longer supported.',
  type: 'string'
}

const event_type: InputField = {
  label: '[Deprecated] Event Type',
  description: 'Deprecated. Use event_name',
  type: 'string'
}

const idfv: InputField = {
  label: '[Deprecated] Identifier for Vendor',
  description: 'Deprecated. Use user_data.idfv',
  type: 'string'
}

const ip_address: InputField = {
  label: '[Deprecated] IP Address',
  description: 'Deprecated. Use user_data.client_ip_address',
  type: 'string'
}

const item_category: InputField = {
  label: '[Deprecated] Item Category',
  // FIXME
  description: 'Category of the item. This field accepts a string.',
  type: 'string',
  default: {
    '@path': '$.properties.category'
  }
}

const item_ids: InputField = {
  label: '[Deprecated] Item ID',
  // FIXME
  description:
    'Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.',
  type: 'string',
  default: {
    '@path': '$.properties.product_id'
  }
}

const level: InputField = {
  label: '[Deprecated] Level',
  description: 'Deprecated. No longer supported.',
  type: 'string'
}

const mobile_ad_id: InputField = {
  label: '[Deprecated] Mobile Ad Identifier',
  description: 'Deprecated. Use user_data.madid',
  type: 'string'
}

const number_items: InputField = {
  label: '[Deprecated] Number of Items',
  description: 'Deprecated. Use custom_data.num_items.',
  type: 'string'
}

const os_version: InputField = {
  label: '[Deprecated] OS Version',
  description: 'Deprecated. Use app_data.version',
  type: 'string'
}

const page_url: InputField = {
  label: '[Deprecated] Page URL',
  description: 'Deprecated. Use event_source_url',
  type: 'string'
}

const phone_number: InputField = {
  label: '[Deprecated] Phone Number',
  description: 'Deprecated. Use user_data.phone',
  type: 'string'
}

const price: InputField = {
  label: '[Deprecated] Price',
  description: 'Deprecated. Use custom_data.value',
  type: 'number'
}

const products: InputField = {
  label: '[Deprecated] Products',
  //  FIXME:
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

const search_string: InputField = {
  label: '[Deprecated] Search String',
  description: 'Deprecated. Use custom_data.search_string',
  type: 'string'
}

const sign_up_method: InputField = {
  label: '[Deprecated] Sign Up Method',
  description: 'Deprecated. Use custom_data.sign_up_method',
  type: 'string'
}

const timestamp: InputField = {
  label: '[Deprecated] Event Timestamp',
  description: 'Deprecated. Use event_time',
  type: 'string'
}

const transaction_id: InputField = {
  label: '[Deprecated] Transaction ID',
  description: 'Deprecated. Use custom_data.order_id',
  type: 'string'
}

const user_agent: InputField = {
  label: '[Deprecated] User Agent',
  description: 'Deprecated. Use user_data.client_user_agent',
  type: 'string'
}

const uuid_c1: InputField = {
  label: '[Deprecated] uuid_c1 Cookie',
  description: 'Deprecated. Use user_data.sc_cookie1',
  type: 'string'
}

const snap_capi_input_fields_deprecated = {
  brands,
  click_id,
  client_dedup_id,
  currency,
  description,
  device_model,
  email,
  event_conversion_type,
  event_tag,
  event_type,
  idfv,
  ip_address,
  item_category,
  item_ids,
  level,
  mobile_ad_id,
  number_items,
  os_version,
  page_url,
  phone_number,
  price,
  products,
  search_string,
  sign_up_method,
  timestamp,
  transaction_id,
  user_agent,
  uuid_c1
}

export default snap_capi_input_fields_deprecated
