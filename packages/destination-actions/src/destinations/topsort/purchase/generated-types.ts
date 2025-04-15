// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique ID generated by the client to suppress duplicate events. The length should not exceed 128 characters.
   */
  id: string
  /**
   * Timestamp that the event happened at.
   */
  occurredAt: string | number
  /**
   * Identifier for tracking users regardless of sign-in status. The length should not exceed 128 characters.
   */
  opaqueUserId: string
  /**
   * Item information list related to the event.
   */
  items: {
    /**
     * The marketplace ID of the product being purchased.
     */
    productId: string
    /**
     * The price of a single item in the marketplace currency.
     */
    unitPrice?: number
    /**
     * Count of products purchased.
     */
    quantity?: number
    /**
     * The vendor ID of the product being purchased.
     */
    vendorId?: string
  }[]
}
