// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Braze ecommerce recommended event
   */
  name: string
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * When this flag is set to true, Braze will only update existing profiles and will not create any new ones.
   */
  _update_existing_only?: boolean
  /**
   * The user email
   */
  email?: string
  /**
   * The user's phone number
   */
  phone?: string | null
  /**
   * The unique user identifier
   */
  braze_id?: string | null
  /**
   * Reason why the order was cancelled.
   */
  cancel_reason?: string
  /**
   * Timestamp for when the event occurred.
   */
  time: string
  /**
   * Unique identifier for the checkout.
   */
  checkout_id?: string
  /**
   * Unique identifier for the order placed.
   */
  order_id?: string
  /**
   * Unique identifier for the cart. If no value is passed, Braze will determine a default value (shared across cart, checkout, and order events) for the user cart mapping.
   */
  cart_id?: string
  /**
   * Total monetary value of the cart.
   */
  total_value?: number
  /**
   * Total amount of discounts applied to the order.
   */
  total_discounts?: number
  /**
   * Details of all discounts applied to the order.
   */
  discounts?: {
    code: string
    amount: number
  }[]
  /**
   * Currency code for the transaction. Defaults to USD if no value passed.
   */
  currency: string
  /**
   * Source the event is derived from.
   */
  source: string
  /**
   * Additional metadata for the ecommerce event.
   */
  metadata?: {
    /**
     * URL for the checkout page.
     */
    checkout_url?: string
    /**
     * URL to view the status of the order.
     */
    order_status_url?: string
    [k: string]: unknown
  }
  /**
   * TODO: description in docs ambiguous.
   */
  type?: string[]
  /**
   * If true, Segment will batch events before sending to Braze’s user track endpoint.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * Product details associated with the ecommerce event.
   */
  product: {
    /**
     * A unique identifier for the product that was viewed. This value be can be the product ID or SKU
     */
    product_id: string
    /**
     * The name of the product that was viewed.
     */
    product_name: string
    /**
     * A unique identifier for the product variant. An example is shirt_medium_blue
     */
    variant_id: string
    /**
     * The URL of the product image.
     */
    image_url?: string
    /**
     * URL to the product page for more details.
     */
    product_url?: string
    /**
     * The variant unit price of the product at the time of viewing.
     */
    price: number
  }
}
