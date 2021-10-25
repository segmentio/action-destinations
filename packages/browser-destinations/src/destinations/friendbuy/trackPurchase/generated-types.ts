// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The order ID.
   */
  orderId: string
  /**
   * Purchase amount to be considered when evaluating reward rules.
   */
  amount: number
  /**
   * The currency of the purchase amount.
   */
  currency: string
  /**
   * The coupon code of any coupon redeemed with the order.
   */
  coupon?: string
  /**
   * Products purchased.
   */
  products?: {
    sku: string
    name?: string
    price: number
    quantity?: number
  }[]
  /**
   * The user's customer ID.
   */
  customerId?: string
  /**
   * The user's anonymous ID.
   */
  anonymousId?: string
  /**
   * Custom attributes to send to Friendbuy. You should pass an object whose keys are the names of the custom attributes and whose values are strings. Non-string-valued attributes will be dropped.
   */
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}
