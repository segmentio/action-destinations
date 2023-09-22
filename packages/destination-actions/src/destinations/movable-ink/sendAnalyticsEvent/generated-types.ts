// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A known user identifier to send to Movable Ink
   */
  userId?: string
  /**
   * An anonymous user identifier to send to Movable Ink
   */
  anonymousId?: string
  /**
   * Timestamp for the event.
   */
  timestamp: string | number
  /**
   * The name of the event
   */
  eventName: string
  /**
   * Product details to associate with the event
   */
  products?: {
    /**
     * Identifier for the product
     */
    product_id: string
    /**
     * Product name
     */
    name?: string
    /**
     * Quantity of the product
     */
    quantity?: number
    /**
     * Product brand
     */
    brand?: string
    /**
     * Product price
     */
    price?: number
  }[]
}
