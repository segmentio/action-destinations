// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event
   */
  event_action: string
  /**
   * List of product details
   */
  products?: {
    /**
     * Identifier for the product
     */
    product_id?: string
    /**
     * Identifier for the product
     */
    product_sku?: string
  }[]
  /**
   * Event ID to maintain unique event data
   */
  event_id?: string
  /**
   * Event timestamp
   */
  timestamp?: string
}
