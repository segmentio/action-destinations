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
   * Anonymize the IP address of the user.
   */
  anonymizeIP: boolean
  /**
   * Segment will create a new Custom Event in Optimizely if the Custom Event doesn't already exist.
   */
  createEventIfNotFound: string
  /**
   * Event Name.
   */
  eventName: string
  /**
   * Event Category
   */
  category: string
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
  eventType: string
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
     * The quantity of items associated with the event.
     */
    quantity?: number
    /**
     * Currency code for revenue. Defaults to USD.
     */
    currency?: string
    [k: string]: unknown
  }
  /**
   * Additional properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
