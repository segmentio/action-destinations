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
  defaultSubscription: 'type = "track" and event = "Order Completed"',
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
        order_id: {
          label: 'Order ID',
          description: 'Unique identifier for the order.',
          type: 'string'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties',
          {
            order_id: {
              '@if': {
                exists: { '@path': '$.properties.order_id' },
                then: { '@path': '$.properties.order_id' },
                else: { '@path': '$.properties.orderId' }
              }
            }
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
          description: 'Id of the product.',
          type: 'string'
        },
        category: {
          label: 'Category',
          description: 'Category of the product',
          type: 'string'
        },
        name: {
          label: 'Name',
          type: 'string',
          description: 'Name of the product'
        },
        sku: {
          label: 'SKU',
          type: 'string',
          description: 'Stock Keeping Unit of the product'
        },
        price: {
          label: 'Price',
          type: 'number',
          description: 'Price of the product'
        },
        image_url: {
          label: 'Image URL of the product',
          type: 'string',
          description: 'URL of the image of the product'
        },
        url: {
          label: 'Product URL',
          type: 'string',
          description: 'URL of the product page'
        },
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the product'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            product_id: {
              '@if': {
                exists: { '@path': '$.properties.product_id' },
                then: { '@path': '$.properties.product_id' },
                else: { '@path': '$.properties.productId' }
              }
            },
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
  const { unique_id, productProperties } = formatOrderedProduct(product, payload.properties.order_id, payload.unique_id)

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
