import { InputField } from '@segment/actions-core/src/destination-kit/types'

// Implementation of the facebook pixel object properties.
// https://developers.facebook.com/docs/facebook-pixel/reference#object-properties
// Only implemented properties that are shared between more than one action.

export const currency: InputField = {
  label: 'Currency',
  description: 'The currency for the value specified.',
  type: 'string',
  default: {
    '@path': '$.properties.currency'
  }
}

export const value: InputField = {
  label: 'Value',
  description: 'The value of a user performing this event to the business.',
  type: 'number',
  default: {
    '@path': '$.properties.revenue'
  }
}

export const content_category: InputField = {
  label: 'Content Category',
  description: 'Category of the page/product.',
  type: 'string'
}

export const content_ids: InputField = {
  label: 'Content IDs',
  description: 'Product IDs associated with the event, such as SKUs (e.g. ["ABC123", "XYZ789"]).',
  type: 'string',
  multiple: true,
  default: {
    '@path': '$.properties.product_id'
  }
}

export const content_name: InputField = {
  label: 'Content Name',
  description: 'Name of the page/product.',
  type: 'string'
}

export const content_type: InputField = {
  label: 'Content Type',
  description: 'Either product or product_group based on the content_ids or contents being passed.',
  type: 'string'
}

export const contents: InputField = {
  label: 'Contents',
  description: 'An array of JSON objects that contains the quantity and the International Article Number (EAN) when applicable, or other product or content identifier(s). id and quantity are the required fields.',
  type: 'object',
  multiple: true,
  default: {
    '@path': '$.properties.products'
  }
}

export const num_items: InputField = {
  label: 'Number of Items',
  description: 'The number of items when checkout was initiated.',
  type: 'number'
}

// The following properties are part of the Facebook Server Event Properties found at
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event

export const event_time: InputField = {
  label: 'Event Time',
  description: 'A Unix timestamp in seconds indicating when the actual event occurred.',
  type: 'number',
  default: {
    '@path': '$.timestamp'
  }
}

export const action_source: InputField = {
  label: 'Action Source',
  description: 'This field allows you to specify where your conversions occurred.',
  type: 'string',
  default: {
    '@path': '$.properties.action_source'
  }
}

export const event_source_url: InputField = {
  label: 'Event Source URL',
  description: 'The browser URL where the event happened. The URL must begin with http:// or https:// and should match the verified domain. event_source_url is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.',
  type: 'string',
  default: {
    '@path': '$.context.page.url'
  }
}

export const event_id: InputField = {
  label: 'Event ID',
  description: 'This ID can be any unique string chosen by the advertiser. event_id is used to deduplicate events sent by both Facebook Pixel and Conversions API.',
  type: 'string',
  default: {
    '@path': '$.messageId'
  }
}