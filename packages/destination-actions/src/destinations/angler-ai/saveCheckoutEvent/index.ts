import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { products, productsDefaultProperties } from '../fields'
import saveBaseEvent from '../saveBaseEvent'
import { transformPayload } from './transform-payload'
import { baseURL, eventsEndpoint } from '../routes'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Save Checkout Event',
  description: 'Save a checkout event.',
  fields: {
    checkoutLineItems: {
      ...products,
      label: 'Checkout Line Items',
      description: 'Checkout Line Item details',
      properties: {
        ...products.properties,
        quantity: {
          label: 'Quantity',
          type: 'number',
          description: 'Quantity of the item'
        },
        discountTitle: {
          label: 'Discount Title',
          type: 'string',
          description: 'The Discount Code applied to the item.'
        },
        discountValue: {
          label: 'Discount Value',
          type: 'number',
          description: 'The Discount value applied to the item.'
        }
      },
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            ...productsDefaultProperties,
            quantity: {
              '@path': '$.quantity'
            },
            discountTitle: {
              '@path': '$.coupon'
            },
            discountValue: {
              '@path': '$.discount'
            }
          }
        ]
      }
    },
    totalAmount: {
      label: 'Total Amount',
      type: 'number',
      description: 'Decimal money amount.',
      default: {
        '@path': '$.properties.total'
      }
    },
    currencyCode: {
      label: 'Currency Code',
      type: 'string',
      description: 'The currency code of the money.',
      default: {
        '@path': '$.properties.currency'
      }
    },
    orderId: {
      label: 'Order ID',
      type: 'string',
      description: 'The ID of the order associated with this checkout.',
      default: {
        '@path': '$.properties.order_id'
      }
    },
    subtotalPriceAmount: {
      label: 'Subtotal Price Amount',
      type: 'number',
      description: 'A monetary value.',
      default: {
        '@path': '$.properties.subtotal'
      }
    },
    totalTaxAmount: {
      label: 'Total Tax Amount',
      type: 'number',
      description: 'A monetary value with currency.',
      default: {
        '@path': '$.properties.tax'
      }
    },
    shippingLinePriceAmount: {
      label: 'Shipping Line Price Amount',
      type: 'number',
      description: 'A monetary value.',
      default: {
        '@path': '$.properties.shipping'
      }
    },
    ...saveBaseEvent.fields
  },
  perform: (request, data) => {
    const transformedPayload = transformPayload(data.payload)

    const payload = {
      src: 'SEGMENT',
      data: [transformedPayload]
    }
    return request(baseURL + eventsEndpoint(data.settings.workspaceId), {
      method: 'post',
      json: payload
    })
  }
}

export default action
