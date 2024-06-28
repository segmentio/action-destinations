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
     * Unique identifier for the order.
     */
    order_id?: string
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
    /**
     * Id of the product.
     */
    product_id?: string
    /**
     * Category of the product
     */
    category?: string
    /**
     * Name of the product
     */
    name?: string
    /**
     * Stock Keeping Unit of the product
     */
    sku?: string
    /**
     * Price of the product
     */
    price?: number
    /**
     * URL of the image of the product
     */
    image_url?: string
    /**
     * URL of the product page
     */
    url?: string
    /**
     * Quantity of the product
     */
    quantity?: number
    [k: string]: unknown
  }[]
}
