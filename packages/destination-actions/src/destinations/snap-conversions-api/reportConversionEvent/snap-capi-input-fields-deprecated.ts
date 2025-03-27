import { InputField } from '@segment/actions-core/destination-kit/types'

const brands: InputField = {
  label: '[Deprecated] Brand',
  description: '[Deprecated] Use Products field.',
  type: 'string',
  multiple: true
}

const click_id: InputField = {
  label: '[Deprecated] Click ID',
  description: 'Deprecated. Use User Data sc_click_id field.',
  type: 'string'
}

const client_dedup_id: InputField = {
  label: '[Deprecated] Client Deduplication ID',
  description: 'Deprecated. Use Event ID field.',
  type: 'string'
}

const currency: InputField = {
  label: '[Deprecated] Currency',
  description: 'Deprecated. Use Custom Data currency field.',
  type: 'string'
}

const description: InputField = {
  label: '[Deprecated] Description',
  description: 'Deprecated. No longer supported.',
  type: 'string'
}

const device_model: InputField = {
  label: '[Deprecated] Device Model',
  description: 'Deprecated. Use App Data deviceName field.',
  type: 'string'
}

const email: InputField = {
  label: '[Deprecated] Email',
  description: 'Deprecated. Use User Data email field.',
  type: 'string'
}

const event_conversion_type: InputField = {
  label: '[Deprecated] Event Conversion Type',
  description: 'Deprecated. Use Action Source field.',
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
  description: 'Deprecated. Use Event Name field.',
  type: 'string'
}

const idfv: InputField = {
  label: '[Deprecated] Identifier for Vendor',
  description: 'Deprecated. Use User Data idfv field.',
  type: 'string'
}

const ip_address: InputField = {
  label: '[Deprecated] IP Address',
  description: 'Deprecated. Use User Data client_ip_address field.',
  type: 'string'
}

const item_category: InputField = {
  label: '[Deprecated] Item Category',
  description: 'Deprecated. Use products field.',
  type: 'string'
}

const item_ids: InputField = {
  label: '[Deprecated] Item ID',
  description: 'Deprecated. Use products field.',
  type: 'string'
}

const level: InputField = {
  label: '[Deprecated] Level',
  description: 'Deprecated. No longer supported.',
  type: 'string'
}

const mobile_ad_id: InputField = {
  label: '[Deprecated] Mobile Ad Identifier',
  description: 'Deprecated. Use User Data madid field.',
  type: 'string'
}

const number_items: InputField = {
  label: '[Deprecated] Number of Items',
  description: 'Deprecated. Use Custom Data num_items field.',
  type: 'string'
}

const os_version: InputField = {
  label: '[Deprecated] OS Version',
  description: 'Deprecated. Use App Data version field.',
  type: 'string'
}

const page_url: InputField = {
  label: '[Deprecated] Page URL',
  description: 'Deprecated. Use Event Source URL field.',
  type: 'string'
}

const phone_number: InputField = {
  label: '[Deprecated] Phone Number',
  description: 'Deprecated. Use User Data phone field.',
  type: 'string'
}

const price: InputField = {
  label: '[Deprecated] Price',
  description: 'Deprecated. Use Custom Data value field.',
  type: 'number'
}

const search_string: InputField = {
  label: '[Deprecated] Search String',
  description: 'Deprecated. Use Custom Data search_string field.',
  type: 'string'
}

const sign_up_method: InputField = {
  label: '[Deprecated] Sign Up Method',
  description: 'Deprecated. Use Custom Data sign_up_method field.',
  type: 'string'
}

const timestamp: InputField = {
  label: '[Deprecated] Event Timestamp',
  description: 'Deprecated. Use Event Timestamp field.',
  type: 'string'
}

const transaction_id: InputField = {
  label: '[Deprecated] Transaction ID',
  description: 'Deprecated. Use Custom Data order_id field.',
  type: 'string'
}

const user_agent: InputField = {
  label: '[Deprecated] User Agent',
  description: 'Deprecated. Use User Data client_user_agent field.',
  type: 'string'
}

const uuid_c1: InputField = {
  label: '[Deprecated] uuid_c1 Cookie',
  description: 'Deprecated. Use User Data sc_cookie1 field.',
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
  search_string,
  sign_up_method,
  timestamp,
  transaction_id,
  user_agent,
  uuid_c1
}

export default snap_capi_input_fields_deprecated
