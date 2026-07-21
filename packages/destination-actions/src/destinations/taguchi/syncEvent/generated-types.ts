// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Target identifier / user identifier for the event. At least one identifier is required.
   */
  target: {
    /**
     * A unique identifier for the target.
     */
    ref?: string
    /**
     * Email address of the target.
     */
    email?: string
  }
  /**
   * Type of event being sent.
   */
  eventType: string
  /**
   * Ecommerce event data including total and products.
   */
  eventData?: {
    /**
     * Total value of the transaction.
     */
    total?: number
    /**
     * Currency code for the transaction.
     */
    currency?: string
    /**
     * Unique identifier for the order.
     */
    order_id?: string
  }
  /**
   * Array of products in the transaction.
   */
  products?: {
    /**
     * Product SKU.
     */
    sku?: string
    /**
     * Product price.
     */
    price?: number
    /**
     * Product quantity.
     */
    quantity?: number
    /**
     * Product name.
     */
    name?: string
    /**
     * Product category.
     */
    category?: string
    [k: string]: unknown
  }[]
}
