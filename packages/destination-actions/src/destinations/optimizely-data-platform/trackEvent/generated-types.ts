// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID to uniquely identify a customer in Optimizely
   */
  id?: string
  /**
   * Anonymous ID if no user Id exist
   */
  anonymous_id?: string
  /**
   * The type of the event.
   */
  event: string
  /**
   * Event ID to maintain unique event data
   */
  event_id?: string
  /**
   * Event timestamp
   */
  timestamp?: string
  /**
   * Event data to be used
   */
  props?: {
    [k: string]: unknown
  }
  /**
   * Product details of the event.
   */
  products?: {
    /**
     * Product ID
     */
    product_id?: string
    /**
     * Name
     */
    name?: string
    [k: string]: unknown
  }[]
}
