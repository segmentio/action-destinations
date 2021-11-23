import type { InputField } from '@segment/actions-core'

import { commonCustomerAttributes, commonCustomerFields } from './commonFields'
import { createFriendbuyPayload, filterFriendbuyAttributes } from './util'

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

export interface AnalyticsPurchasePayload {
  orderId: string
  amount: number
  currency: string
  coupon?: string
  giftCardCodes?: string[]
  products?: {
    sku?: string
    name?: string
    quantity?: number
    price: number
    description?: string
    category?: string
    url?: string
    image_url?: string
  }[]
  customerId?: string
  anonymousId?: string
  email?: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  loyaltyStatus?: string
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}

export function createPurchasePayload(analyticsPayload: AnalyticsPurchasePayload) {
  const products =
    analyticsPayload.products && analyticsPayload.products.length > 0
      ? analyticsPayload.products.map(normalizeProduct)
      : undefined

  const [nonCustomerPayload, customerAttributes] = commonCustomerAttributes(analyticsPayload)
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

  return friendbuyPayload
}

function normalizeProduct<T extends { image_url?: string }>(p: T) {
  const p2: T & { quantity: number; imageUrl?: string } = { quantity: 1, ...p }
  if (p.image_url !== undefined) {
    p2.imageUrl = p.image_url
    delete p2.image_url
  }
  return p2
}
