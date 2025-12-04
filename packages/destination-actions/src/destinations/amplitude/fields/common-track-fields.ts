import { InputField } from '@segment/actions-core'

export const adid: InputField = {
  label: 'Google Play Services Advertising ID',
  type: 'string',
  description: 'Google Play Services advertising ID. _(Android)_',
  default: {
    '@if': {
      exists: { '@path': '$.context.device.advertisingId' },
      then: { '@path': '$.context.device.advertisingId' },
      else: { '@path': '$.context.device.idfa' }
    }
  }
}

export const android_id: InputField = {
  label: 'Android ID',
  type: 'string',
  description: 'Android ID (not the advertising ID). _(Android)_'
}

export const event_id: InputField = {
  label: 'Event ID',
  type: 'integer',
  description:
    'An incrementing counter to distinguish events with the same user ID and timestamp from each other. Amplitude recommends you send an event ID, increasing over time, especially if you expect events to occur simultanenously.'
}

export const event_properties: InputField = {
    label: 'Event Properties',
    type: 'object',
    description:
      'An object of key-value pairs that represent additional data to be sent along with the event. You can store property values in an array, but note that Amplitude only supports one-dimensional arrays. Date values are transformed into string values. Object depth may not exceed 40 layers.',
    default: {
      '@path': '$.properties'
    }
}

export const event_type: InputField = {
    label: 'Event Type',
    type: 'string',
    description: 'A unique identifier for your event.',
    required: true,
    default: {
        '@path': '$.event'
    }
}

export const idfa: InputField = {
  label: 'Identifier For Advertiser (IDFA)',
  type: 'string',
  description: 'Identifier for Advertiser. _(iOS)_',
  default: {
    '@if': {
      exists: { '@path': '$.context.device.advertisingId' },
      then: { '@path': '$.context.device.advertisingId' },
      else: { '@path': '$.context.device.idfa' }
    }
  }
}

export const idfv: InputField = {
  label: 'Identifier For Vendor (IDFV)',
  type: 'string',
  description: 'Identifier for Vendor. _(iOS)_',
  default: {
    '@path': '$.context.device.id'
  }
}

export const ip: InputField = {
  label: 'IP Address',
  type: 'string',
  description:
    'The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user\'s location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers.',
  default: {
    '@path': '$.context.ip'
  }
}

export const location_lat: InputField = {
  label: 'Latitude',
  type: 'number',
  description: 'The current Latitude of the user.',
  default: {
    '@path': '$.context.location.latitude'
  }
}

export const location_lng: InputField = {
  label: 'Longtitude',
  type: 'number',
  description: 'The current Longitude of the user.',
  default: {
    '@path': '$.context.location.longitude'
  }
}

export const price: InputField = {
  label: 'Price',
  type: 'number',
  description:
    'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.',
  default: {
    '@path': '$.properties.price'
  }
}

export const productId: InputField = {
  label: 'Product ID',
  type: 'string',
  description:
    'An identifier for the item purchased. You must send a price and quantity or revenue with this field.',
  default: {
    '@path': '$.properties.productId'
  }
}

export const products: InputField = {
    label: 'Products',
    description: 'The list of products purchased.',
    type: 'object',
    multiple: true,
    additionalProperties: true,
    properties: {
        price: {
            label: 'Price',
            type: 'number',
            description:
            'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.'
        },
        quantity: {
            label: 'Quantity',
            type: 'integer',
            description: 'The quantity of the item purchased. Defaults to 1 if not specified.'
        },
        revenue: {
            label: 'Revenue',
            type: 'number',
            description:
            'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds.'
        },
        productId: {
            label: 'Product ID',
            type: 'string',
            description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        },
        revenueType: {
            label: 'Revenue Type',
            type: 'string',
            description:
            'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.'
        }
    },
    default: {
    '@arrayPath': [
        '$.properties.products',
        {
        price: {
            '@path': 'price'
        },
        revenue: {
            '@path': 'revenue'
        },
        quantity: {
            '@path': 'quantity'
        },
        productId: {
            '@path': 'productId'
        },
        revenueType: {
            '@path': 'revenueType'
        }
        }
    ]
    }
}

export const quantity: InputField = {
  label: 'Quantity',
  type: 'integer',
  description: 'The quantity of the item purchased. Defaults to 1 if not specified.',
  default: {
    '@path': '$.properties.quantity'
  }
}

export const revenue: InputField = {
  label: 'Revenue',
  type: 'number',
  description:
    'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds. **Note:** You will need to explicitly set this if you are using the Amplitude in cloud-mode.',
  default: {
    '@path': '$.properties.revenue'
  }
}

export const revenueType: InputField = {
  label: 'Revenue Type',
  type: 'string',
  description:
    'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.',
  default: {
    '@path': '$.properties.revenueType'
  }
}

export const session_id: InputField = {
    label: 'Session ID',
    type: 'datetime',
    description: 'The start time of the session, necessary if you want to associate events with a particular system. To use automatic Amplitude session tracking in browsers, enable Analytics 2.0 on your connected source.',
    default: {
        '@path': '$.integrations.Actions Amplitude.session_id'
    }
}

export const use_batch_endpoint: InputField ={
    label: 'Use Batch Endpoint',
    description:
    "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
    type: 'boolean',
    default: false
}

export const common_track_fields = {
  adid,
  android_id,
  event_id,
  event_properties,
  event_type,
  idfa,
  idfv,
  ip,
  location_lat,
  location_lng,
  price,
  productId,
  products,
  quantity,
  revenue,
  revenueType,
  session_id,
  use_batch_endpoint
}














