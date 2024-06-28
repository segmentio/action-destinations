// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Properties of the profile that triggered this event.
   */
  profile: {
    email?: string
    phone_number?: string
    /**
     * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system.
     */
    external_id?: string
    /**
     * Anonymous user identifier for the user.
     */
    anonymous_id?: string
    [k: string]: unknown
  }
  /**
   * Properties of this event.
   */
  properties: {
    /**
     * Unique identifier for the checkout.
     */
    checkout_id?: string
    /**
     * Unique identifier for the order.
     */
    order_id?: string
    /**
     * Affiliation of the order.
     */
    affiliation?: string
    /**
     * Subtotal of the order.
     */
    subtotal?: number
    /**
     * Tax of the order.
     */
    tax?: number
    /**
     * Revenue ($) associated with the transaction (including discounts, but excluding shipping and taxes)
     */
    revenue?: number
    /**
     * Shipping cost associated with the transaction.
     */
    shipping?: number
    /**
     * Discount of the order.
     */
    discount?: number
    /**
     * Coupon code used for the order.
     */
    coupon?: string
    /**
     * Currency of the order.
     */
    currency?: string
    [k: string]: unknown
  }
  /**
   * When this event occurred. By default, the time the request was received will be used.
   *       The time is truncated to the second. The time must be after the year 2000 and can only
   *       be up to 1 year in the future.
   *
   */
  time?: string | number
  /**
   * A numeric value to associate with this event. For example, the dollar amount of a purchase.
   */
  value?: number
  /**
   * A unique identifier for an event. If the unique_id is repeated for the same
   *       profile and metric, only the first processed event will be recorded. If this is not
   *       present, this will use the time to the second. Using the default, this limits only one
   *       event per profile per second.
   *
   */
  unique_id?: string
  /**
   * List of products purchased in the order.
   */
  products?: {
    product_id?: string
    category?: string
    name?: string
    sku?: string
    price?: number
    image_url?: string
    url?: string
    quantity?: number
    [k: string]: unknown
  }[]
}
