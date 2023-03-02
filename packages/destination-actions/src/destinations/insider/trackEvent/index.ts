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
      allowNull: true,
      description: '',
      default: {
        '@path': '$.userId'
      }
    },
    segment_anonymous_id: {
      label: 'Anonymous Id',
      type: 'string',
      allowNull: false,
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
      allowNull: false,
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'When the event occurred',
      type: 'datetime',
      required: true,
      allowNull: false,
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
        email_subject: {
          label: 'Email Subject',
          type: 'string'
        },
        campaign_id: {
          label: 'Campaign Id',
          type: 'string'
        },
        campaign_name: {
          label: 'Campaign Name',
          type: 'string'
        },
        url: {
          label: 'Link Url',
          type: 'string'
        },
        product_id: {
          label: 'Product Id',
          type: 'string',
          description: 'Product id displayed on the list'
        },
        ta: {
          label: 'Product Category',
          type: 'string',
          description: 'Product category being viewed'
        },
        na: {
          label: 'Product Name',
          type: 'string',
          description: 'Name of the product being viewed'
        },
        variant_id: {
          label: 'Variant Id',
          type: 'string',
          description: 'Variant of the product'
        },
        usp: {
          label: 'Unit Sale Price',
          type: 'number',
          description: 'Sale Price ($) of the product being viewed'
        },
        up: {
          label: 'Unit Price',
          type: 'number',
          description: 'Price ($) of the product being viewed'
        },
        qu: {
          label: 'Quantity',
          type: 'integer',
          description: 'Quantity of a product'
        },
        piu: {
          label: 'Product Image Url',
          type: 'string'
        },
        e_quid: {
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
        email_subject: { '@path': '$.properties.email_subject' },
        campaign_id: { '@path': '$.properties.campaign_id' },
        campaign_name: { '@path': '$.properties.campaign_name' },
        url: {
          '@if': {
            exists: { '@path': '$.properties.url' },
            then: { '@path': '$.properties.url' },
            else: { '@path': '$.properties.link_url' }
          }
        },
        product_id: { '@path': '$.properties.product_id' },
        ta: { '@path': '$.properties.category' },
        na: { '@path': '$.properties.name' },
        variant_id: { '@path': '$.properties.variant' },
        usp: { '@path': '$.properties.price' },
        up: { '@path': '$.properties.price' },
        qu: { '@path': '$.properties.quantity' },
        piu: { '@path': '$.properties.image_url' },
        e_quid: { '@path': '$.properties.cart_id' },
        referrer: { '@path': '$.properties.referrer' },
        user_agent: { '@path': '$.userAgent' }
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
        ta: {
          label: 'Taxonomy',
          type: 'string',
          description: 'Taxonomy'
        },
        na: {
          label: 'Name',
          type: 'string',
          description: 'Name'
        },
        usp: {
          label: 'Unit Sale Price',
          type: 'number',
          description: 'Price'
        },
        up: {
          label: 'Unit Price',
          type: 'number',
          description: 'Price'
        },
        qu: {
          label: 'Quantity',
          type: 'integer',
          description: 'Quantity'
        },
        url: {
          label: 'Product Url',
          type: 'string',
          description: 'Product Url'
        },
        piu: {
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
            ta: { '@path': 'category' },
            na: { '@path': 'name' },
            variant_id: { '@path': 'variant' },
            usp: { '@path': 'price' },
            up: { '@path': 'price' },
            qu: { '@path': 'quantity' },
            url: { '@path': 'url' },
            piu: { '@path': 'image_url' }
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
        email: { '@path': '$.email' },
        phone: { '@path': '$.phone' },
        age: { '@path': '$.age' },
        birthday: { '@path': '$.birthday' },
        name: { '@path': '$.firstName' },
        gender: { '@path': '$.gender' },
        surname: { '@path': '$.lastName' },
        app_version: { '@path': '$.context.version' },
        idfa: { '@path': '$.device.advertisingId' },
        model: { '@path': '$.device.model' },
        last_ip: { '@path': '$.ip' },
        city: { '@path': '$.location.city' },
        country: { '@path': '$.location.country' },
        carrier: { '@path': '$.network.carrier' },
        os_version: { '@path': '$.os.version' },
        platform: { '@path': '$.os.name' },
        timezone: { '@path': '$.timezone' },
        locale: { '@path': '$.locale' }
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
