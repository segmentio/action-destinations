// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier.
   */
  customer_id: string
  /**
   * Discount code, if any, used on purchase. Will be used in addition to per-product coupons in Segment v2commerce events spec.
   */
  discount_code?: string
  /**
   * Optional Identifier for transaction.
   */
  transaction_id?: string
  /**
   * Total order amount.
   */
  spend?: number
  /**
   * product(s) purchased in transaction.
   */
  products: {
    [k: string]: unknown
  }[]
  /**
   * timestamp of when transaction event occurred.
   */
  purchase_datetime: string | number
  /**
   * Dataset label, should be left as default unless specified otherwise
   */
  stream_key: string
}
