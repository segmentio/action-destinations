import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { API_URL } from '../config'
import { v4 as uuidv4 } from '@lukeed/uuid'

function createOrderCompleteEvent(payload: Payload) {
  // Categories, Item Names, Items
  const properties = { ...payload.properties }
  delete properties.products
  const categories = payload.products?.filter((product) => product.category).map((product) => product.category)
  const itemNames = payload.products?.filter((product) => product.name).map((product) => product.name)
  const specialProps = [
    'sku',
    'name',
    'quantity',
    'item price',
    'price',
    'row total',
    'categories',
    'category',
    'image url',
    'image_url',
    'imageUrl',
    'product url',
    'product_url',
    'productUrl'
  ]

  const items = payload.products?.map((product) => {
    const customProps = { ...product }
    for (const prop of specialProps) {
      delete customProps[prop]
    }

    const { sku, name, quantity, price, category } = product
    return {
      SKU: sku,
      Name: name,
      Quantity: quantity,
      ItemPrice: price,
      RowTotal: price,
      Categories: [category],
      ProductURL: product['product_url'] ?? product['productURL'],
      ImageURL: product['image_url'] ?? product['imageUrl'],
      ...customProps
    }
  })

  return {
    data: {
      type: 'event',
      attributes: {
        properties: {
          ...properties,
          Categories: categories,
          'Item Names': itemNames,
          Items: items
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

const sendProductRequests = async (payload: Payload, request: RequestClient) => {
  if (!payload.products || !Array.isArray(payload.products)) {
    return
  }

  delete payload.properties?.products
  const productPromises = payload.products.map((product) => {
    const productEventData = {
      data: {
        type: 'event',
        attributes: {
          properties: { ...product, ...payload.properties },
          unique_id: uuidv4(),
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'Ordered Product'
              }
            }
          },
          time: payload.properties.time,
          profile: payload.properties.profile
        }
      }
    }

    return request(`${API_URL}/events/`, {
      method: 'POST',
      json: productEventData
    })
  })

  await Promise.all(productPromises)
}

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
      default: {
        '@path': '$.properties'
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
        order_id: {
          label: 'Order ID',
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
          label: 'Image URL',
          type: 'string'
        },
        product_url: {
          label: 'Product URL',
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
            order_id: {
              '@if': {
                exists: { '@path': '$.properties.order_id' },
                then: { '@path': '$.properties.order_id' },
                else: {
                  '@path': '$.properties.orderId'
                }
              }
            },
            category: { '@path': '$.properties.category' },
            name: { '@path': '$.properties.name' },
            sku: { '@path': '$.properties.sku' },
            price: { '@path': '$.properties.price' },
            imageUrl: {
              '@if': {
                exists: { '@path': '$.properties.imageUrl' },
                then: { '@path': '$.properties.imageUrl' },
                else: { '@path': '$.properties.image_url' }
              }
            },
            productUrl: {
              '@if': {
                exists: { '@path': '$.properties.productUrl' },
                then: { '@path': '$.properties.productUrl' },
                else: { '@path': '$.properties.product_url' }
              }
            },
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

export default action
