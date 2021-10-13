import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { FriendbuyAPI } from '..'

const amountSourceChoices = ['revenue', 'subtotal', 'total'] as const
type AmountSource = typeof amountSourceChoices[number]

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Purchase',
  description: 'Record a purchase in Friendbuy.',
  defaultSubscription: 'event = "Order Completed"', // see https://segment.com/docs/config-api/fql/
  platform: 'web',
  // https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
  fields: {
    orderId: {
      label: 'Order ID',
      description: 'The order Id',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.order_id' }
    },

    amountSource: {
      // Values available for amount:
      // - `revenue` is the sum of the costs of the items being ordered.
      // - `subtotal` is `revenue` minus any discount.
      // - `total` is `subtotal` plus tax and shipping.
      label: 'Amount Source',
      description: 'Source of purchase amount to send to Friendbuy.',
      type: 'string',
      required: true,
      choices: amountSourceChoices as unknown as string[],
      default: 'total'
    },
    revenue: {
      label: 'Revenue',
      description: 'The sum of the costs of the items being purchased.',
      type: 'number',
      required: false,
      default: { '@path': '$.properties.revenue' }
    },
    subtotal: {
      label: 'Subtotal',
      description: 'Revenue minus any discounts.',
      type: 'number',
      required: false,
      default: { '@path': '$.properties.subtotal' }
    },
    total: {
      label: 'Total',
      description: 'Subtotal plus tax and shipping.',
      type: 'number',
      required: false,
      default: { '@path': '$.properties.total' }
    },

    currency: {
      label: 'Currency',
      description: 'The currency of the purchase amount.',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.currency' }
    },
    coupon: {
      // Might be used to establish attribution.
      label: 'Coupon',
      description: 'The coupon code of any coupon redeemed with the order.',
      type: 'string',
      required: false,
      default: { '@path': '$.properties.coupon' }
    },

    products: {
      label: 'Products',
      description: 'Products purchased',
      type: 'object',
      multiple: true,
      required: false,
      properties: {
        sku: {
          label: 'Product SKU',
          type: 'string',
          required: true
        },
        name: {
          label: 'Product Name',
          type: 'string',
          required: false
        },
        price: {
          label: 'Price',
          type: 'number',
          required: true
        },
        quantity: {
          label: 'Quantity (default 1)',
          type: 'integer',
          required: false
        }
      },
      default: {
        '@path': '$.properties.products'
      }
    },

    customerId: {
      label: 'Customer ID',
      description: "The user's customerId.",
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    }
  },

  perform: (friendbuyAPI, data) => {
    // console.log('trackPurchase.perform', JSON.stringify(data, null, 2))
    const amount =
      data.payload[data.payload.amountSource as AmountSource] ||
      data.payload.total ||
      data.payload.subtotal ||
      data.payload.revenue
    if (amount === undefined) {
      return
    }

    const products =
      data.payload.products && data.payload.products.length > 0
        ? data.payload.products.map((p) => ({ quantity: 1, ...p }))
        : undefined

    friendbuyAPI.push([
      'track',
      'purchase',
      {
        id: data.payload.orderId,
        amount,
        currency: data.payload.currency,
        couponCode: data.payload.coupon,
        ...(data.payload.customerId && { customer: { id: data.payload.customerId } }),
        products
      }
    ])
  }
}

export default action
