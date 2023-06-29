// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * NetElixer User ID
   */
  user_id: string
  /**
   * Total value of the order
   */
  total: number
  /**
   * List of product details in the order
   */
  products?: {
    [k: string]: unknown
  }
  /**
   * Currency of the order (e.g. USD)
   */
  currency?: string
  /**
   * Total cost of shipping
   */
  shipping?: number
  /**
   * Unique ID of the order
   */
  order_id: string
  /**
   * Identifier for anonymous user
   */
  anonymous_id?: string
  /**
   * The user&#39;s email address
   */
  email: string
}
