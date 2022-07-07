// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event
   */
  event_name: string
  /**
   * price or monetary amount
   */
  price?: {
    /**
     * the amount
     */
    amount: number
    /**
     * the currency of the amount. defaults to USD if left empty
     */
    currency?: string
  }
  /**
   * Parameters specific to the event
   */
  event_metadata?: {
    [k: string]: unknown
  }
}
