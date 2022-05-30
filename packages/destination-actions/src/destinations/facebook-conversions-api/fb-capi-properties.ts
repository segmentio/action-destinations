import { InputField } from '@segment/actions-core/src/destination-kit/types'
import { IntegrationError } from '@segment/actions-core'

// Implementation of the facebook pixel object properties.
// https://developers.facebook.com/docs/facebook-pixel/reference#object-properties
// Only implemented properties that are shared between more than one action.

type Content = {
  id?: string
  delivery_category?: string
}

export const custom_data: InputField = {
  label: 'Custom Data',
  description:
    'The custom data object can be used to pass custom properties. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data#custom-properties) for more information.',
  type: 'object',
  defaultObjectUI: 'keyvalue'
}

export const currency: InputField = {
  label: 'Currency',
  description: 'The currency for the value specified. Currency must be a valid ISO 4217 three-digit currency code.',
  type: 'string',
  default: {
    '@path': '$.properties.currency'
  }
}

export const value: InputField = {
  label: 'Value',
  description: 'A numeric value associated with this event. This could be a monetary value or a value in some other metric.',
  type: 'number'
}

export const content_category: InputField = {
  label: 'Content Category',
  description: 'The category of the content associated with the event.',
  type: 'string'
}

export const content_ids: InputField = {
  label: 'Content IDs',
  description: 'The content IDs associated with the event, such as product SKUs.',
  type: 'string',
  multiple: true
}

export const content_name: InputField = {
  label: 'Content Name',
  description: 'The name of the page or product associated with the event.',
  type: 'string'
}

export const content_type: InputField = {
  label: 'Content Type',
  description: 'The content type should be set to product or product_group. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data) for more information.',
  type: 'string'
}

export const contents: InputField = {
  label: 'Contents',
  description:
    'A list of JSON objects that contain the product IDs associated with the event plus information about the products. ID and quantity are required fields.',
  type: 'object',
  multiple: true,
  properties: {
    id: {
      label: 'ID',
      description: 'The product ID of the purchased item.',
      type: 'string'
    },
    quantity: {
      label: 'Quantity',
      description: 'The number of items purchased.',
      type: 'integer'
    },
    item_price: {
      label: 'Item Price',
      description: 'The price of the item.',
      type: 'number'
    },
    delivery_category: {
      label: 'Delivery Category',
      description:
        'The type of delivery for a purchase event. Supported values are "in_store", "curbside", and "home_delivery".',
      type: 'string'
    }
  }
}

export const validateContents = (contents: Content[]): IntegrationError | false => {
  const valid_delivery_categories = ['in_store', 'curbside', 'home_delivery']

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i]

    if (!item.id) {
      return new IntegrationError(`contents[${i}] must include an 'id' parameter.`, 'Misconfigured required field', 400)
    }

    if (item.delivery_category && !valid_delivery_categories.includes(item.delivery_category)) {
      return new IntegrationError(
        `contents[${i}].delivery_category must be one of {in_store, home_delivery, curbside}.`,
        'Misconfigured field',
        400
      )
    }
  }

  return false
}

export const num_items: InputField = {
  label: 'Number of Items',
  description: 'The number of items when checkout was initiated.',
  type: 'integer'
}

// The following properties are part of the Facebook Server Event Properties found at
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event

export const event_time: InputField = {
  label: 'Event Time',
  description: 'A Unix timestamp in seconds indicating when the actual event occurred. Facebook will automatically convert ISO 8601 timestamps to Unix.',
  type: 'string',
  default: {
    '@path': '$.timestamp'
  }
}

export const action_source: InputField = {
  label: 'Action Source',
  description: 'This field allows you to specify where your conversions occurred. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event) for supported values.',
  type: 'string'
}

export const event_source_url: InputField = {
  label: 'Event Source URL',
  description:
    'The browser URL where the event happened. The URL must begin with http:// or https:// and should match the verified domain. This is required if the action source is "website."',
  type: 'string',
  default: {
    '@path': '$.context.page.url'
  }
}

export const event_id: InputField = {
  label: 'Event ID',
  description:
    'This ID can be any unique string. Event ID is used to deduplicate events sent by both Facebook Pixel and Conversions API.',
  type: 'string',
  default: {
    '@path': '$.messageId'
  }
}
