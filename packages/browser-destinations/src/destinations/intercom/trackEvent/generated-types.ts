// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * Price or monetary amount.
   */
  price?: {
    /**
     * The amount.
     */
    amount: number
    /**
     * The currency of the amount. It defaults to USD if left empty.
     */
    currency?: string
  }
  /**
   * Parameters specific to the event.
   */
  event_metadata: {
    [k: string]: unknown
  }
}
