import { InputField } from '@segment/actions-core'

export const eventProperties: Record<string, InputField> = {
  distinct_id: {
    label: 'Distinct ID',
    type: 'string',
    description: 'A distinct ID specified by you.',
    default: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    }
  },
  group_id: {
    label: 'Group ID',
    type: 'string',
    description: 'The unique identifier of the group that performed this event.',
    default: {
      '@path': '$.context.groupId'
    }
  },
  time: {
    label: 'Timestamp',
    type: 'datetime',
    description:
      'The timestamp of the event. If time is not sent with the event, it will be set to the time our servers receive it.',
    default: {
      '@path': '$.timestamp'
    }
  },
  app_name: {
    label: 'App Name',
    type: 'string',
    description: 'The name of your application',
    default: {
      '@path': '$.context.app.name'
    }
  },
  app_namespace: {
    label: 'App Namespace',
    type: 'string',
    description: 'The namespace of your application.',
    default: {
      '@path': '$.context.app.namespace'
    }
  },
  app_build: {
    label: 'App Build',
    type: 'string',
    description: 'The current build of your application.',
    default: {
      '@path': '$.context.app.build'
    }
  },
  app_version: {
    label: 'App Version',
    type: 'string',
    description: 'The current version of your application.',
    default: {
      '@path': '$.context.app.version'
    }
  },
  os_name: {
    label: 'OS Name',
    type: 'string',
    description: 'The name of the mobile operating system or browser that the user is using.',
    default: {
      '@path': '$.context.os.name'
    }
  },
  os_version: {
    label: 'OS Version',
    type: 'string',
    description: 'The version of the mobile operating system or browser the user is using.',
    default: {
      '@path': '$.context.os.version'
    }
  },
  device_id: {
    label: 'Device ID',
    type: 'string',
    description: 'A unique identifier for the device the user is using.',
    default: {
      '@path': '$.context.device.id'
    }
  },
  device_type: {
    label: 'Device Type',
    type: 'string',
    description: "The type of the user's device",
    default: {
      '@path': '$.context.device.type'
    }
  },
  device_name: {
    label: 'Device Name',
    type: 'string',
    description: "The name of the user's device",
    default: {
      '@path': '$.context.device.name'
    }
  },
  device_manufacturer: {
    label: 'Device Manufacturer',
    type: 'string',
    description: 'The device manufacturer that the user is using.',
    default: {
      '@path': '$.context.device.manufacturer'
    }
  },
  device_model: {
    label: 'Device Model',
    type: 'string',
    description: 'The device model that the user is using.',
    default: {
      '@path': '$.context.device.model'
    }
  },
  bluetooth: {
    label: 'Bluetooth Enabled',
    type: 'boolean',
    description: 'Whether bluetooth is enabled',
    default: {
      '@path': '$.context.network.bluetooth'
    }
  },
  carrier: {
    label: 'Carrier',
    type: 'string',
    description: 'The carrier that the user is using.',
    default: {
      '@path': '$.context.network.carrier'
    }
  },
  cellular: {
    label: 'Cellular Enabled',
    type: 'boolean',
    description: 'Whether cellular is enabled',
    default: {
      '@path': '$.context.network.cellular'
    }
  },
  wifi: {
    label: 'Wifi',
    type: 'boolean',
    description: 'Set to true if user’s device has an active, available Wifi connection, false if not.',
    default: {
      '@path': '$.context.network.wifi'
    }
  },
  country: {
    label: 'Country',
    type: 'string',
    description: 'The current country of the user.',
    default: {
      '@path': '$.context.location.country'
    }
  },
  region: {
    label: 'Region',
    type: 'string',
    description: 'The current region of the user.',
    default: {
      '@path': '$.context.location.region'
    }
  },
  language: {
    label: 'Language',
    type: 'string',
    description: 'The language set by the user.',
    default: {
      '@path': '$.context.locale'
    }
  },
  library_name: {
    label: 'Library Name',
    type: 'string',
    description: 'The name of the SDK used to send events',
    default: {
      '@path': '$.context.library.name'
    }
  },
  library_version: {
    label: 'Library Version',
    type: 'string',
    description: 'The version of the SDK used to send events',
    default: {
      '@path': '$.context.library.version'
    }
  },
  ip: {
    label: 'IP Address',
    type: 'string',
    description: "The IP address of the user. This is only used for geolocation and won't be stored.",
    default: {
      '@path': '$.context.ip'
    }
  },
  idfa: {
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
  },
  url: {
    label: 'URL',
    type: 'string',
    description: 'The full URL of the webpage on which the event is triggered.',
    default: {
      '@path': '$.context.page.url'
    }
  },
  screen_width: {
    label: 'Screen width',
    type: 'number',
    description: 'Width, in pixels, of the device screen.',
    default: {
      '@path': '$.context.screen.density'
    }
  },
  screen_height: {
    label: 'Screen height',
    type: 'number',
    description: 'Height, in pixels, of the device screen.',
    default: {
      '@path': '$.context.screen.density'
    }
  },
  screen_density: {
    label: 'Screen density',
    type: 'number',
    description: 'Pixel density of the device screen.',
    default: {
      '@path': '$.context.screen.density'
    }
  },
  referrer: {
    label: 'Referrer',
    type: 'string',
    description: 'Referrer url',
    default: {
      '@path': '$.context.page.referrer'
    }
  },
  userAgent: {
    label: 'User Agent',
    type: 'string',
    description: 'User agent',
    default: {
      '@path': '$.context.userAgent'
    }
  },
  event_properties: {
    label: 'Event Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data to be sent along with the event.',
    default: {
      '@path': '$.properties'
    }
  },
  user_properties: {
    label: 'User Properties',
    type: 'object',
    description: 'An object of key-value pairs that represent additional data tied to the user.',
    default: {
      '@path': '$.traits'
    }
  },
  utm_properties: {
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
  },
  enable_batching: {
    type: 'boolean',
    label: 'Batch Data to Mixpanel',
    description: 'Set as true to ensure Segment sends data to Mixpanel in batches.',
    default: true
  }
}

export const productsProperties: Record<string, InputField> = {
  products: {
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
}
