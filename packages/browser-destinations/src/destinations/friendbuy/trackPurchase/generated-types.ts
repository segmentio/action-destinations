// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The order Id
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
