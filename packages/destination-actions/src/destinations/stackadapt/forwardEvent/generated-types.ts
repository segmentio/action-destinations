// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user in Segment
   */
  user_id?: string
  /**
   * The Segment event type (page, track, etc.)
   */
  event_type?: string
  /**
   * The event name (e.g. Order Completed)
   */
  action?: string
  /**
   * IP address of the user
   */
  ip_fwd: string
  /**
   * The title of the page where the event occurred.
   */
  title?: string
  /**
   * The URL of the page where the event occurred.
   */
  url?: string
  /**
   * The referrer of the page where the event occurred.
   */
  referrer?: string
  /**
   * UTM source parameter associated with event
   */
  utm_source?: string
  /**
   * User-Agent of the user
   */
  user_agent: string
  /**
   * Email address of the individual who triggered the event.
   */
  email?: string
  /**
   * Phone number of the individual who triggered the event
   */
  phone?: string
  /**
   * First name of the individual who triggered the event.
   */
  first_name?: string
  /**
   * Last name of the individual who triggered the event.
   */
  last_name?: string
  /**
   * Additional ecommerce fields that are included in the pixel payload.
   */
  ecommerce_data?: {
    /**
     * The revenue generated from the event.
     */
    revenue?: number
    /**
     * The ID of the order.
     */
    order_id?: string
    /**
     * The price of the product.
     */
    product_price?: number
    /**
     * The quantity of the product.
     */
    product_quantity?: number
    /**
     * An identifier for the product.
     */
    product_id?: string
    /**
     * A category for the product.
     */
    product_category?: string
    /**
     * The name of the product.
     */
    product_name?: string
    [k: string]: unknown
  }
  /**
   * The list of products associated with the event (for events with multiple products, such as Order Completed)
   */
  ecommerce_products?: {
    /**
     * The price of the product.
     */
    product_price?: number
    /**
     * The quantity of the product.
     */
    product_quantity?: number
    /**
     * An identifier for the product.
     */
    product_id?: string
    /**
     * A category for the product.
     */
    product_category?: string
    /**
     * The name of the product.
     */
    product_name?: string
    [k: string]: unknown
  }[]
}
