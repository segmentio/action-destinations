// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique ID for the event message
   */
  messageId: string
  /**
   * Timestamp when the event occurred
   */
  timestamp: string | number
  /**
   * Anonymous identifier for the user
   */
  anonymousId: string
  /**
   * The list of products viewed. Each product is a promotable entity.
   */
  products: {
    /**
     * The ID of the resolved bid for the product.
     */
    resolvedBidId: string
    /**
     * Additional attribution information for the product.
     */
    additionalAttribution?: {
      [k: string]: unknown
    }
  }[]
}
