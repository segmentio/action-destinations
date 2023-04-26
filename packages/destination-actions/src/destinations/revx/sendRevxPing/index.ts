import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Revx Ping',
  description: 'Send event to revx',
  defaultSubscription: 'type = "track" or type ="screen"',
  fields: {
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
      default: { '@path': '$.context.device.advertisingId' }
    },
    event_name: {
      label: 'Event name',
      description: 'A unique identifier for your event.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.name' },
          then: { '@path': '$.name' },
          else: { '@path': '$.event' }
        }
      }
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
      description: 'Identifier for Device Id for IOS and Android',
      default: {
        '@path': '$.context.device.id'
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
        '@path': '$.context.traits'
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
    product: {
      label: 'Product',
      description: 'The single product viewed or Added to cart.',
      type: 'object',
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
        productId: {
          label: 'Product ID',
          type: 'string',
          description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        }
      },
      default: {
        price: { '@path': '$.properties.price' },
        quantity: { '@path': '$.properties.quantity' },
        productId: { '@path': '$.properties.productId' }
      }
    },
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
        productId: {
          label: 'Product ID',
          type: 'string',
          description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            price: {
              '@path': 'price'
            },
            quantity: {
              '@path': 'quantity'
            },
            productId: {
              '@path': 'productId'
            }
          }
        ]
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
      description: 'The IP address of the user. Use "$remote" to use the IP address on the upload request. ',
      default: {
        '@path': '$.context.ip'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const body = { ...settings, ...payload }
    return request('https://segmentdata.atomex.net/data/1x1.gif', {
      method: 'post',
      json: body
    })
  }
}

export default action
