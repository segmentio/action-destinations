// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.
   */
  endUserId: string
  /**
   * The unique identifier for the project.
   */
  projectID: string
  /**
   * Event Name.
   */
  eventName: string
  /**
   * Timestampt for when the event took place
   */
  timestamp: string | number
  /**
   * Unique message UUID to send with the event
   */
  uuid: string
  /**
   * The type of Segment event
   */
  type: string
  /**
   * Tags to send with the event
   */
  tags?: {
    /**
     * The currency amount associated with the event. For example for $20.05 USD send 20.05
     */
    revenue?: number
    /**
     * Value associated with the event.
     */
    value?: number
    /**
     * Quantity.
     */
    quantity?: number
    /**
     * Currency code for revenue. Defaults to USD.
     */
    currency?: string
  }
}
