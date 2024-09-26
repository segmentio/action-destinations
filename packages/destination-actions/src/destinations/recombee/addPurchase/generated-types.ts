// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user who purchased the item(s).
   */
  userId: string
  /**
   * The items that were purchased.
   */
  items: {
    /**
     * ID of the item.
     */
    itemId: string
    /**
     * The amount (number) of the item purchased.
     */
    amount?: number
    /**
     * The price of the purchased item. If `amount` is greater than 1, the price of one item should be given.
     */
    price?: number
    /**
     * The profit of the purchased item. If `amount` is greater than 1, the profit per one item should be given.
     */
    profit?: number
  }[]
  /**
   * The UTC timestamp of when the purchase occurred.
   */
  timestamp?: string
  /**
   * The ID of the clicked recommendation (if the purchase is based on a recommendation request).
   */
  recommId?: string
  /**
   * Additional data to be stored with the purchase. *Keep this field empty unless instructed by the Recombee Support team.*
   */
  additionalData?: {
    [k: string]: unknown
  }
}
