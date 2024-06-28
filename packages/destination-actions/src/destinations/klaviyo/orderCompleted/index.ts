import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { API_URL } from '../config'
import { convertKeysToTitleCase, formatOrderedProduct, formatProductItems } from './formatters'
import { Product } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Order Completed',
  description: 'Order Completed Event action tracks users Order Completed events and associate it with their profile.',
  defaultSubscription: 'type = "track"',
  fields: {
    profile: {
      label: 'Profile',
      description: `Properties of the profile that triggered this event.`,
      type: 'object',
      properties: {
        email: {
          label: 'Email',
          type: 'string'
        },
        phone_number: {
          label: 'Phone Number',
          type: 'string'
        },
        external_id: {
          label: 'External Id',
          description:
            'A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system.',
          type: 'string',
          default: { '@path': '$.userId' }
        },
        anonymous_id: {
          label: 'Anonymous Id',
          description: 'Anonymous user identifier for the user.',
          type: 'string',
          default: { '@path': '$.anonymousId' }
        }
      },
      additionalProperties: true,
      required: true
    },
    properties: {
      description: `Properties of this event.`,
      label: 'Properties',
      type: 'object',
      additionalProperties: true,
      properties: {
        checkout_id: {
          label: 'Checkout ID',
          description: 'Unique identifier for the checkout.',
          type: 'string'
        },
        order_id: {
          label: 'Order ID',
          description: 'Unique identifier for the order.',
          type: 'string'
        },
        affiliation: {
          label: 'Affiliation',
          description: 'Affiliation of the order.',
          type: 'string'
        },
        subtotal: {
          label: 'Subtotal',
          description: 'Subtotal of the order.',
          type: 'number'
        },
        tax: {
          label: 'Tax',
          description: 'Tax of the order.',
          type: 'number'
        },
        revenue: {
          label: 'Revenue',
          description:
            'Revenue ($) associated with the transaction (including discounts, but excluding shipping and taxes)',
          type: 'number'
        },
        shipping: {
          label: 'Shipping',
          description: 'Shipping cost associated with the transaction.',
          type: 'number'
        },
        discount: {
          label: 'Discount',
          description: 'Discount of the order.',
          type: 'number'
        },
        coupon: {
          label: 'Coupon',
          description: 'Coupon code used for the order.',
          type: 'string'
        },
        currency: {
          label: 'Currency',
          description: 'Currency of the order.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties',
          {
            checkout_id: { '@path': '$.properties.checkout_id' },
            order_id: { '@path': '$.properties.order_id' },
            affiliation: { '@path': '$.properties.affiliation' },
            subtotal: { '@path': '$.properties.subtotal' },
            tax: { '@path': '$.properties.tax' },
            revenue: { '@path': '$.properties.revenue' },
            shipping: { '@path': '$.properties.shipping' },
            discount: { '@path': '$.properties.discount' },
            coupon: { '@path': '$.properties.coupon' },
            currency: { '@path': '$.properties.currency' }
          }
        ]
      },
      required: true
    },
    time: {
      label: 'Time',
      description: `When this event occurred. By default, the time the request was received will be used.
      The time is truncated to the second. The time must be after the year 2000 and can only
      be up to 1 year in the future.
      `,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    value: {
      label: 'Value',
      description: 'A numeric value to associate with this event. For example, the dollar amount of a purchase.',
      type: 'number'
    },
    unique_id: {
      label: 'Unique ID',
      description: `A unique identifier for an event. If the unique_id is repeated for the same
      profile and metric, only the first processed event will be recorded. If this is not
      present, this will use the time to the second. Using the default, this limits only one
      event per profile per second.
      `,
      type: 'string',
      default: {
        '@path': '$.messageId'
      }
    },
    products: {
      label: 'Products',
      description: 'List of products purchased in the order.',
      multiple: true,
      type: 'object',
      additionalProperties: true,
      properties: {
        product_id: {
          label: 'Product ID',
          type: 'string'
        },
        category: {
          label: 'Category',
          type: 'string'
        },
        name: {
          label: 'Name',
          type: 'string'
        },
        sku: {
          label: 'SKU',
          type: 'string'
        },
        price: {
          label: 'Price',
          type: 'number'
        },
        image_url: {
          label: 'Image URL of the product',
          type: 'string'
        },
        url: {
          label: 'URL of the product page',
          type: 'string'
        },
        quantity: {
          label: 'Quantity',
          type: 'number'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: { '@path': '$.properties.product_id' },
            category: { '@path': '$.properties.category' },
            name: { '@path': '$.properties.name' },
            sku: { '@path': '$.properties.sku' },
            price: { '@path': '$.properties.price' },
            image_url: { '@path': '$.properties.image_url' },
            url: { '@path': '$.properties.url' },
            quantity: { '@path': '$.properties.quantity' }
          }
        ]
      }
    }
  },

  perform: async (request, { payload }) => {
    const { email, phone_number, external_id, anonymous_id } = payload.profile

    if (!email && !phone_number && !external_id && !anonymous_id) {
      throw new PayloadValidationError('One of External ID, Anonymous ID, Phone Number or Email is required.')
    }

    const eventData = createOrderCompleteEvent(payload)
    const event = await request(`${API_URL}/events/`, {
      method: 'POST',
      json: eventData
    })

    if (event.status == 202 && Array.isArray(payload.products)) {
      await sendProductRequests(payload, request)
    }
    return event
  }
}

function createOrderCompleteEvent(payload: Payload) {
  // products is generally an array part of the properties object.
  // so we get rid of it as we already map it to payload.products
  delete payload.properties?.products
  const categories = payload.products?.filter((product) => Boolean(product.category)).map((product) => product.category)
  const itemNames = payload.products?.filter((product) => Boolean(product.name)).map((product) => product.name)

  const items = payload.products?.map(formatProductItems)

  return {
    data: {
      type: 'event',
      attributes: {
        properties: {
          Categories: categories,
          ItemNames: itemNames,
          // products array is reformatted and sent as items
          Items: items,
          ...convertKeysToTitleCase(payload.properties)
        },
        time: payload.time,
        value: payload.value,
        unique_id: payload.unique_id,
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: 'Order Completed'
            }
          }
        },
        profile: {
          data: {
            type: 'profile',
            attributes: payload.profile
          }
        }
      }
    }
  }
}

function sendOrderedProduct(request: RequestClient, payload: Payload, product: Product) {
  const { unique_id, productProperties } = formatOrderedProduct(product, payload.properties.order_id)

  const productEventData = {
    data: {
      type: 'event',
      attributes: {
        properties: convertKeysToTitleCase(productProperties),
        unique_id: unique_id,
        // for ordered product, we use price as value
        value: product.price,
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: 'Ordered Product'
            }
          }
        },
        time: payload.time,
        profile: {
          data: {
            type: 'profile',
            attributes: payload.profile
          }
        }
      }
    }
  }

  return request(`${API_URL}/events/`, {
    method: 'POST',
    json: productEventData
  })
}

const sendProductRequests = async (payload: Payload, request: RequestClient) => {
  if (!Array.isArray(payload.products)) {
    return
  }

  // products is generally an array part of the properties object.
  // so we get rid of it as we already map it to payload.products
  delete payload.properties?.products

  const productPromises = payload.products.map((product) => sendOrderedProduct(request, payload, product))
  await Promise.all(productPromises)
}

export default action
