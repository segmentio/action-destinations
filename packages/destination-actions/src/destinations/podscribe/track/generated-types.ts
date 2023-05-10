// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The anonymous ID associated with the user
   */
  anonymousId?: string | null
  /**
   * The timestamp of the event
   */
  timestamp: string
  /**
   * The page referrer
   */
  referrer?: string | null
  /**
   * The page URL
   */
  url?: string | null
  /**
   * The IP address of the device sending the event.
   */
  ip: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * Email address of the user
   */
  email?: string | null
  /**
   * Properties to send with the event
   */
  properties?: {
    /**
     * The total value of the order
     */
    total?: number
    /**
     * The order ID. A unique identifier for the order
     */
    order_id?: string
    /**
     * Currency code. e.g. USD for US dollar, EUR for Euro
     */
    currency?: string
    /**
     * Coupon Code. A Discount code for the purchase
     */
    coupon?: string
    /**
     * The number of items purchased in this order
     */
    num_items_purchased?: number
    /**
     * true value indicates if the user is a new customer
     */
    is_new_customer?: boolean
    /**
     * true value indicates a subscription
     */
    is_subscription?: boolean
    [k: string]: unknown
  }
  /**
   * Podscribe type of event to send
   */
  podscribeEvent: string
}
