import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Revx Ping',
  description: 'Send event to revx',
  fields: {
    client_id: {
      label: 'Revx specific client id',
      description: 'Revx client id which you will get it from RevX support team',
      type: 'string',
      required: true
    },
    os: {
      label: 'Platform',
      type: 'string',
      description: 'Platform of the device.',
      required: true,
      default: {
        '@path': '$.context.device.type'
      }
    },
    advertising_id: {
      label: 'Identifier For Advertiser (IDFA/GAID)',
      type: 'string',
      description: 'Identifier For Advertiser (IDFA/GAID)',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.advertisingId' },
          then: { '@path': '$.context.device.advertisingId' },
          else: { '@path': '$.context.device.idfa' }
        }
      }
    },
    event_name: {
      label: 'Event name',
      description: 'A unique identifier for your event.',
      type: 'string',
      default: { '@path': '$.name' }
    },
    event: {
      label: 'Event name',
      description: 'A unique identifier for your event.',
      type: 'string',
      default: { '@path': '$.event' }
    },
    type: {
      label: 'Request type',
      description: 'A unique identifier for your request type.',
      type: 'string',
      default: { '@path': '$.type' }
    },
    idfv: {
      label: 'Identifier For Vendor (IDFV)',
      type: 'string',
      description: 'Identifier for Vendor. _(iOS)_',
      default: {
        '@path': '$.context.device.id'
      }
    },
    device_id: {
      label: 'Device ID',
      type: 'string',
      description:
        'A device-specific identifier, such as the Identifier for Vendor on iOS. Required unless user ID is present. If a device ID is not sent with the event, it will be set to a hashed version of the user ID.',
      default: {
        '@if': {
          exists: { '@path': '$.context.device.id' },
          then: { '@path': '$.context.device.id' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    time: {
      label: 'Timestamp',
      type: 'datetime',
      description:
        'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
      default: {
        '@path': '$.timestamp'
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
      description: 'An object of key-value pairs that represent additional data tied to the user',
      default: {
        '@path': '$.traits'
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
    device_brand: {
      label: 'Device Brand',
      type: 'string',
      description: 'The device brand that the user is using.',
      default: {
        '@path': '$.context.device.brand'
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
    carrier: {
      label: 'Carrier',
      type: 'string',
      description: 'The carrier that the user is using.',
      default: {
        '@path': '$.context.network.carrier'
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
    city: {
      label: 'City',
      type: 'string',
      description: 'The current city of the user.',
      default: {
        '@path': '$.context.location.city'
      }
    },
    dma: {
      label: 'Designated Market Area',
      type: 'string',
      description: 'The current Designated Market Area of the user.'
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'The language set by the user.',
      default: {
        '@path': '$.context.locale'
      }
    },
    price: {
      label: 'Price',
      type: 'number',
      description: 'The price of the item purchased. Required for revenue data if the revenue field is not sent.',
      default: {
        '@path': '$.properties.price'
      }
    },
    quantity: {
      label: 'Quantity',
      type: 'integer',
      description: 'The quantity of the item purchased. Defaults to 1 if not specified.',
      default: {
        '@path': '$.properties.quantity'
      }
    },
    revenue: {
      label: 'Revenue',
      type: 'number',
      description:
        'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value.',
      default: {
        '@path': '$.properties.revenue'
      }
    },
    productId: {
      label: 'Product ID',
      type: 'string',
      description:
        'An identifier for the item purchased. You must send a price and quantity or revenue with this field.',
      default: {
        '@path': '$.properties.productId'
      }
    },
    revenueType: {
      label: 'Revenue Type',
      type: 'string',
      description:
        'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.',
      default: {
        '@path': '$.properties.revenueType'
      }
    },
    location_lat: {
      label: 'Latitude',
      type: 'number',
      description: 'The current Latitude of the user.',
      default: {
        '@path': '$.context.location.latitude'
      }
    },
    location_lng: {
      label: 'Longtitude',
      type: 'number',
      description: 'The current Longitude of the user.',
      default: {
        '@path': '$.context.location.longitude'
      }
    },
    ip: {
      label: 'IP Address',
      type: 'string',
      description:
        'The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user\'s location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers. You can submit a request to Amplitude\'s platform specialist team here to configure this for you.',
      default: {
        '@path': '$.context.ip'
      }
    },
    data: {
      label: 'Data',
      description: 'Payload data.',
      type: 'object',
      default: { '@path': '$.' }
    }
  },
  perform: (request, data) => {
    return request('https://data.atomex.net/data/1x1.gif', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
