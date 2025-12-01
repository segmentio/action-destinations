import { InputField } from '@segment/actions-core'

export const user_id: InputField = {
    label: 'User ID',
    type: 'string',
    allowNull: true,
    description: 'A readable ID specified by you. Must have a minimum length of 5 characters. Required unless device ID is present. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event.',
    default: {
        '@path': '$.userId'
    }
}

export const device_id: InputField = {
    label: 'Device ID',
    type: 'string',
    description: 'A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.',
    default: {
        '@if': {
            exists: { '@path': '$.context.device.id' },
            then: { '@path': '$.context.device.id' },
            else: { '@path': '$.anonymousId' }
        }
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

export const session_id: InputField = {
    label: 'Session ID',
    type: 'datetime',
    description: 'The start time of the session, necessary if you want to associate events with a particular system. To use automatic Amplitude session tracking in browsers, enable Analytics 2.0 on your connected source.',
    default: {
        '@path': '$.integrations.Actions Amplitude.session_id'
    }
}

export const time: InputField = {
    label: 'Timestamp',
    type: 'datetime',
    description: 'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
    default: {
        '@path': '$.timestamp'
    }
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

export const user_properties: InputField = {
    label: 'User Properties',
    type: 'object',
    description:
      'An object of key-value pairs that represent additional data tied to the user. You can store property values in an array, but note that Amplitude only supports one-dimensional arrays. Date values are transformed into string values. Object depth may not exceed 40 layers.',
    default: {
      '@path': '$.traits'
    }
}

export const groups: InputField = {
    label: 'Groups',
    type: 'object',
    description:
      'Groups of users for the event as an event-level group. You can only track up to 5 groups. **Note:** This Amplitude feature is only available to Enterprise customers who have purchased the Accounts add-on.'
}

export const app_version: InputField = {
    label: 'App Version',
    type: 'string',
    description: 'The current version of your application.',
    default: {
      '@path': '$.context.app.version'
    }
}


export const platform: InputField = {
    label: 'Platform',
    type: 'string',
    description:
      'Platform of the device. If using analytics.js to send events from a Browser and no if no Platform value is provided, the value "Web" will be sent.',
    default: {
      '@path': '$.context.device.type'
    }
}

export const os_name: InputField = {
    label: 'OS Name',
    type: 'string',
    description: 'The name of the mobile operating system or browser that the user is using.',
    default: {
      '@path': '$.context.os.name'
    }
}


export const os_version: InputField = {
  label: 'OS Version',
  type: 'string',
  description: 'The version of the mobile operating system or browser the user is using.',
  default: {
    '@path': '$.context.os.version'
  }
};

export const device_brand: InputField = {
  label: 'Device Brand',
  type: 'string',
  description: 'The device brand that the user is using.',
  default: {
    '@path': '$.context.device.brand'
  }
};

export const device_manufacturer: InputField = {
  label: 'Device Manufacturer',
  type: 'string',
  description: 'The device manufacturer that the user is using.',
  default: {
    '@path': '$.context.device.manufacturer'
  }
};

export const device_model: InputField = {
  label: 'Device Model',
  type: 'string',
  description: 'The device model that the user is using.',
  default: {
    '@path': '$.context.device.model'
  }
};

export const carrier: InputField = {
  label: 'Carrier',
  type: 'string',
  description: 'The carrier that the user is using.',
  default: {
    '@path': '$.context.network.carrier'
  }
};

export const country: InputField = {
  label: 'Country',
  type: 'string',
  description: 'The current country of the user.',
  default: {
    '@path': '$.context.location.country'
  }
}

export const region: InputField = {
  label: 'Region',
  type: 'string',
  description: 'The current region of the user.',
  default: {
    '@path': '$.context.location.region'
  }
}

export const city: InputField = {
  label: 'City',
  type: 'string',
  description: 'The current city of the user.',
  default: {
    '@path': '$.context.location.city'
  }
}

export const dma: InputField = {
  label: 'Designated Market Area',
  type: 'string',
  description: 'The current Designated Market Area of the user.'
}

export const language: InputField = {
  label: 'Language',
  type: 'string',
  description: 'The language set by the user.',
  default: {
    '@path': '$.context.locale'
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

export const productId: InputField = {
  label: 'Product ID',
  type: 'string',
  description:
    'An identifier for the item purchased. You must send a price and quantity or revenue with this field.',
  default: {
    '@path': '$.properties.productId'
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

export const ip: InputField = {
  label: 'IP Address',
  type: 'string',
  description:
    'The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user\'s location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers.',
  default: {
    '@path': '$.context.ip'
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

export const insert_id: InputField = {
  label: 'Insert ID',
  type: 'string',
  description:
    'Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.'
}

export const library: InputField = {
  label: 'Library',
  type: 'string',
  description: 'The name of the library that generated the event.',
  default: {
    '@path': '$.context.library.name'
  }
}


export const userAgent: InputField ={
    label: 'User Agent',
    type: 'string',
    description: 'The user agent of the device sending the event.',
    default: {
    '@path': '$.context.userAgent'
    }
}

export const userAgentParsing: InputField = {
    label: 'User Agent Parsing',
    type: 'boolean',
    description:
    'Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field',
    default: true
}

export const includeRawUserAgent: InputField ={
    label: 'Include Raw User Agent',
    type: 'boolean',
    description:
    'Enabling this setting will send user_agent based on the raw user agent string provided in the userAgent field',
    default: false
}


export const utm_properties: InputField = {
    label: 'UTM Properties',
    type: 'object',
    description: 'UTM Tracking Properties',
    properties: {
        utm_source: {
            label: 'UTM Source',
            type: 'string'
        },
        utm_medium: {
            label: 'UTM Medium',
            type: 'string'
        },
        utm_campaign: {
            label: 'UTM Campaign',
            type: 'string'
        },
        utm_term: {
            label: 'UTM Term',
            type: 'string'
        },
        utm_content: {
            label: 'UTM Content',
            type: 'string'
        }
    },
    default: {
        utm_source: { '@path': '$.context.campaign.source' },
        utm_medium: { '@path': '$.context.campaign.medium' },
        utm_campaign: { '@path': '$.context.campaign.name' },
        utm_term: { '@path': '$.context.campaign.term' },
        utm_content: { '@path': '$.context.campaign.content' }
    }
}

export const referrer: InputField = {
    label: 'Referrer',
    type: 'string',
    description:
    'The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”',
    default: {
    '@path': '$.context.page.referrer'
    }
}

/**
 * The common fields defined by Amplitude's events api
 * @see {@link https://developers.amplitude.com/docs/http-api-v2#keys-for-the-event-argument}
 */
export const eventSchema: Record<string, InputField> = {
    user_id,
    device_id,
    event_type,
    session_id,
    time,
    event_properties,
    user_properties,
    groups,
    app_version,
    platform,
    os_name,
    os_version,
    device_brand,
    device_manufacturer,
    device_model,
    carrier,
    country,
    region,
    city,
    dma,
    language,
    price,
    quantity,
    revenue,
    productId,
    revenueType,
    location_lat,
    location_lng,
    ip,
    idfa,
    idfv,
    adid,
    android_id,
    event_id,
    insert_id,
    library, 
    userAgent
}

export const userAgentData: InputField = {
  label: 'User Agent Data',
  type: 'object',
  description: 'The user agent data of device sending the event',
  properties: {
    model: {
      label: 'Model',
      type: 'string'
    },
    platformVersion: {
      label: 'PlatformVersion',
      type: 'string'
    }
  },
  default: {
    model: { '@path': '$.context.userAgentData.model' },
    platformVersion: { '@path': '$.context.userAgentData.platformVersion' }
  }
}

export const min_id_length: InputField = {
    label: 'Minimum ID Length',
    description: 'Amplitude has a default minimum id length of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
    allowNull: true,
    type: 'integer'
}

export const use_batch_endpoint: InputField ={
    label: 'Use Batch Endpoint',
    description:
    "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
    type: 'boolean',
    default: false
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