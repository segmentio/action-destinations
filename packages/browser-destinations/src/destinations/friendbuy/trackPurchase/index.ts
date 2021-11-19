import type { InputField } from '@segment/actions-core'
import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonCustomerAttributes, commonCustomerFields } from '../commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from '../util'

// see https://segment.com/docs/config-api/fql/
export const trackPurchaseDefaultSubscription = 'event = "Order Completed"'

// https://segment.com/docs/connections/spec/ecommerce/v2/#order-completed
export const trackPurchaseFields: Record<string, InputField> = {
  orderId: {
    label: 'Order ID',
    description: 'The order ID.',
    type: 'string',
    required: true,
    default: { '@path': '$.properties.order_id' }
  },

  amount: {
    // Values available for amount:
    // - `revenue` is the sum of the costs of the items being ordered.
    // - `subtotal` is `revenue` minus any discount.
    // - `total` is `subtotal` plus tax and shipping.
    label: 'Amount Source',
    description: 'Purchase amount to be considered when evaluating reward rules.',
    type: 'number',
    required: true,
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
  giftCardCodes: {
    // Might be used to establish attribution.
    label: 'Gift Card Codes',
    description: 'An array of gift card codes applied to the order.',
    type: 'string',
    multiple: true,
    required: false,
    default: { '@path': '$.properties.giftCardCodes' }
  },

  products: {
    label: 'Products',
    description: 'Products purchased.',
    type: 'object',
    multiple: true,
    required: false,
    properties: {
      sku: {
        label: 'Product SKU',
        type: 'string',
        required: false
      },
      name: {
        label: 'Product Name',
        type: 'string',
        required: false
      },
      quantity: {
        label: 'Quantity (default 1)',
        type: 'integer',
        required: false
      },
      price: {
        label: 'Price',
        type: 'number',
        required: true
      },
      description: {
        label: 'Product Description',
        type: 'string',
        required: false
      },
      category: {
        label: 'Product Category',
        type: 'string',
        required: false
      },
      url: {
        label: 'Product URL',
        type: 'string',
        required: false
      },
      image_url: {
        label: 'Product Image URL',
        type: 'string',
        required: false
      }
    },
    default: { '@path': '$.properties.products' }
  },

  ...commonCustomerFields(false),

  friendbuyAttributes: {
    label: 'Custom Attributes',
    description:
      'Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.',
    type: 'object',
    required: false,
    default: { '@path': '$.properties.friendbuyAttributes' }
  }
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  defaultSubscription: trackPurchaseDefaultSubscription,
  platform: 'web',
  fields: trackPurchaseFields,

  perform: (friendbuyAPI, data) => {
    const products =
      data.payload.products && data.payload.products.length > 0
        ? data.payload.products.map(normalizeProduct)
        : undefined

    const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes(data.payload)
    const friendbuyPayload = createFriendbuyPayload(
      [
        ['id', nonCustomerPayload.orderId],
        ['amount', nonCustomerPayload.amount],
        ['currency', nonCustomerPayload.currency],
        ['couponCode', nonCustomerPayload.coupon],
        ['giftCardCodes', nonCustomerPayload.giftCardCodes],
        ['customer', createFriendbuyPayload(customerAttributes)],
        ['products', products],
        // custom properties
        ...filterFriendbuyAttributes(nonCustomerPayload.friendbuyAttributes)
      ],
      { dropEmpty: true }
    )
    friendbuyAPI.push(['track', 'purchase', friendbuyPayload, true])
  }
}

function normalizeProduct<T extends { image_url?: string }>(p: T) {
  const p2: T & { quantity: number; imageUrl?: string } = { quantity: 1, ...p }
  if (p.image_url !== undefined) {
    p2.imageUrl = p.image_url
    delete p2.image_url
  }
  return p2
}

export default action
