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
   * Specify how Segment should match the Segment event to an Optimizely event, as well as specify if Segment should create new Custom Events and Pages in Optimizely if they don't exist.
   */
  eventMatching: {
    /**
     * If needed, Segment can define new Custom Events and Pages in Optimizely. If you do not want Segment to create new events, select "Do not create".
     */
    createEventIfNotFound: string
    /**
     * Optimizely event or page name to record the event against.
     */
    eventName?: string
    /**
     * Optimizely event or page key to record the event against.
     */
    eventKey?: string
    /**
     * Optimizely event or page ID to record the event against. The ID can only be used when the event / page has already been created in Optimizely. Segment cannot create new events in Optimizely using the ID.
     */
    eventId?: string
  }
  /**
   * The URL of the page where the event occurred.
   */
  pageUrl?: string
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
