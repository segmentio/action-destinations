// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who added the item to the cart.
   */
  userId: string
  /**
   * The item that was added to the cart.
   */
  item: {
    /**
     * ID of the item.
     */
    itemId: string
    /**
     * The amount (number) of the item added to the cart.
     */
    amount?: number
    /**
     * The price of the added item. If `amount` is greater than 1, the price of one item should be given.
     */
    price?: number
  }
  /**
   * The UTC timestamp of when the cart addition occurred, in Unix seconds, Unix milliseconds, or ISO-8601 format. When recording interactions you plan to later delete by exact timestamp — whether via this destination or the Recombee API directly — avoid mapping the root `timestamp` here, as it may be corrected for clock skew. Use `properties.timestamp` instead.
   */
  timestamp?: string | number
  /**
   * The ID of the clicked recommendation (if the cart addition is based on a recommendation request).
   */
  recommId?: string
  /**
   * Internal additional data to be stored with the cart addition.
   */
  internalAdditionalData?: {
    [k: string]: unknown
  }
  /**
   * Additional data to be stored with the cart addition. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
