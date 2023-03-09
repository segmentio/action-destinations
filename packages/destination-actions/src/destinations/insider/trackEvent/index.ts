import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_BASE, UPSERT_ENDPOINT, sendTrackEvent } from '../insider-helpers'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Records events in Insider',
  defaultSubscription:
    'type = "track" and event != "Order Completed" and event != "Cart Viewed" and event != "Checkout Viewed"',
  fields: {
    uuid: {
      label: 'User ID',
      type: 'string',
      description: '',
      default: {
        '@path': '$.userId'
      }
    },
    segment_anonymous_id: {
      label: 'Anonymous Id',
      type: 'string',
      description: 'Anonymous user id.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    name: {
      label: 'Event Name',
      description: 'The event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'When the event occurred',
      type: 'datetime',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    parameters: {
      label: 'Event Parameters',
      description: '',
      type: 'object',
      additionalProperties: true,
      properties: {
        url: {
          label: 'Link Url',
          type: 'string'
        },
        product_id: {
          label: 'Product Id',
          type: 'string',
          description: 'Product id displayed on the list'
        },
        taxonomy: {
          label: 'Product Category',
          type: 'string',
          description: 'Product category being viewed'
        },
        name: {
          label: 'Product Name',
          type: 'string',
          description: 'Name of the product being viewed'
        },
        variant_id: {
          label: 'Variant Id',
          type: 'number',
          description: 'Variant of the product'
        },
        unit_sales_price: {
          label: 'Unit Sale Price',
          type: 'number',
          description: 'Sale Price ($) of the product being viewed'
        },
        unit_price: {
          label: 'Unit Price',
          type: 'number',
          description: 'Price ($) of the product being viewed'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'Quantity of a product'
        },
        product_image_url: {
          label: 'Product Image Url',
          type: 'string'
        },
        event_group_id: {
          label: 'Event Group ID',
          type: 'string',
          description: 'Order or Basket Id'
        },
        referrer: {
          label: 'Referrer',
          type: 'string'
        },
        user_agent: {
          label: 'User Agent',
          type: 'string'
        }
      },
      default: {
        url: {
          '@if': {
            exists: { '@path': '$.properties.url' },
            then: { '@path': '$.properties.url' },
            else: { '@path': '$.context.page.url' }
          }
        },
        product_id: { '@path': '$.properties.product_id' },
        taxonomy: { '@path': '$.properties.category' },
        name: { '@path': '$.properties.name' },
        variant_id: { '@path': '$.properties.variant' },
        unit_sales_price: { '@path': '$.properties.price' },
        unit_price: { '@path': '$.properties.price' },
        quantity: { '@path': '$.properties.quantity' },
        product_image_url: { '@path': '$.properties.image_url' },
        event_group_id: { '@path': '$.properties.cart_id' },
        referrer: {
          '@if': {
            exists: { '@path': '$.properties.referrer' },
            then: { '@path': '$.properties.referrer' },
            else: { '@path': '$.context.page.referrer' }
          }
        },
        user_agent: { '@path': '$.context.userAgent' }
      }
    },
    products: {
      label: 'Products',
      description: 'The list of products purchased.',
      type: 'object',
      multiple: true,
      additionalProperties: true,
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string',
          description: 'Product ID'
        },
        taxonomy: {
          label: 'Taxonomy',
          type: 'string',
          description: 'Taxonomy'
        },
        name: {
          label: 'Name',
          type: 'string',
          description: 'Name'
        },
        unit_sales_price: {
          label: 'Unit Sale Price',
          type: 'number',
          description: 'Price'
        },
        unit_price: {
          label: 'Unit Price',
          type: 'number',
          description: 'Price'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'Quantity'
        },
        url: {
          label: 'Product Url',
          type: 'string',
          description: 'Product Url'
        },
        product_image_url: {
          label: 'Product Image Url',
          type: 'string',
          description: 'Product Image Url'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: { '@path': 'productId' },
            taxonomy: { '@path': 'category' },
            name: { '@path': 'name' },
            variant_id: { '@path': 'variant' },
            unit_sales_price: { '@path': 'price' },
            unit_price: { '@path': 'price' },
            quantity: { '@path': 'quantity' },
            url: { '@path': 'url' },
            product_image_url: { '@path': 'image_url' }
          }
        ]
      }
    },
    attributes: {
      label: 'User Properties',
      description: '',
      type: 'object',
      additionalProperties: true,
      properties: {
        email: {
          label: 'Email',
          type: 'string',
          description: 'Email address of a user'
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          description: 'Phone number of a user'
        },
        age: {
          label: 'Age',
          type: 'number',
          description: 'Age of a user'
        },
        birthday: {
          label: 'Phone Number',
          type: 'string',
          description: 'User’s birthday'
        },
        name: {
          label: 'User First Name',
          type: 'string',
          description: 'First name of a user'
        },
        gender: {
          label: 'Gender',
          type: 'string',
          description: 'Gender of a user'
        },
        surname: {
          label: 'User Surname',
          type: 'string',
          description: 'Last name of a user'
        },
        app_version: {
          label: 'App Version',
          type: 'string'
        },
        idfa: {
          label: 'IDFA',
          type: 'string',
          description: 'IDFA used for Google and Facebook remarketing'
        },
        model: {
          label: 'Device Model',
          type: 'string'
        },
        last_ip: {
          label: 'Ip Adresses',
          type: 'string'
        },
        city: {
          label: 'City',
          type: 'string'
        },
        country: {
          label: 'Country',
          type: 'string'
        },
        carrier: {
          label: 'Carrier',
          type: 'string'
        },
        os_version: {
          label: 'OS Version',
          type: 'string'
        },
        platform: {
          label: 'OS Name',
          type: 'string'
        },
        timezone: {
          label: 'Timezone',
          type: 'string'
        },
        locale: {
          label: 'Locale',
          type: 'string'
        }
      },
      default: {
        email: {
          '@if': {
            exists: { '@path': '$.context.traits.email' },
            then: { '@path': '$.context.traits.email' },
            else: { '@path': '$.properties.email' }
          }
        },
        phone: {
          '@if': {
            exists: { '@path': '$.context.traits.phone' },
            then: { '@path': '$.context.traits.phone' },
            else: { '@path': '$.properties.phone' }
          }
        },
        age: {
          '@if': {
            exists: { '@path': '$.context.traits.age' },
            then: { '@path': '$.context.traits.age' },
            else: { '@path': '$.properties.age' }
          }
        },
        birthday: {
          '@if': {
            exists: { '@path': '$.context.traits.birthday' },
            then: { '@path': '$.context.traits.birthday' },
            else: { '@path': '$.properties.birthday' }
          }
        },
        name: {
          '@if': {
            exists: { '@path': '$.context.traits.first_name' },
            then: { '@path': '$.context.traits.first_name' },
            else: { '@path': '$.properties.first_name' }
          }
        },
        gender: {
          '@if': {
            exists: { '@path': '$.context.traits.gender' },
            then: { '@path': '$.context.traits.gender' },
            else: { '@path': '$.properties.gender' }
          }
        },
        surname: {
          '@if': {
            exists: { '@path': '$.context.traits.last_name' },
            then: { '@path': '$.context.traits.last_name' },
            else: { '@path': '$.properties.last_name' }
          }
        },
        app_version: { '@path': '$.context.app.version' },
        idfa: { '@path': '$.context.device.advertisingId' },
        model: { '@path': '$.context.device.model' },
        last_ip: { '@path': '$.context.ip' },
        city: {
          '@if': {
            exists: { '@path': '$.context.location.city' },
            then: { '@path': '$.context.location.city' },
            else: { '@path': '$.properties.address.city' }
          }
        },
        country: {
          '@if': {
            exists: { '@path': '$.context.location.country' },
            then: { '@path': '$.context.location.country' },
            else: { '@path': '$.properties.address.country' }
          }
        },
        carrier: { '@path': '$.context.network.carrier' },
        os_version: { '@path': '$.os.version' },
        platform: { '@path': '$.context.os.name' },
        timezone: { '@path': '$.context.timezone' },
        locale: { '@path': '$.context.locale' }
      }
    }
  },
  perform: (request, data) => {
    return request(`${API_BASE}${UPSERT_ENDPOINT}`, {
      method: 'post',
      json: sendTrackEvent(data.payload)
    })
  }
}

export default action
