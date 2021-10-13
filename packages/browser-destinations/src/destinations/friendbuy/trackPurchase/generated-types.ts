// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The order Id
   */
  orderId: string
  /**
   * Source of purchase amount to send to Friendbuy.
   */
  amountSource: string
  /**
   * The sum of the costs of the items being purchased.
   */
  revenue?: number
  /**
   * Revenue minus any discounts.
   */
  subtotal?: number
  /**
   * Subtotal plus tax and shipping.
   */
  total?: number
  /**
   * The currency of the purchase amount.
   */
  currency: string
  /**
   * The coupon code of any coupon redeemed with the order.
   */
  coupon?: string
  /**
   * Products purchased
   */
  products?: {
    sku: string
    name?: string
    price: number
    quantity?: number
  }[]
  /**
   * The user's customerId.
   */
  customerId: string
}
