// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique message UUID to send with the event
   */
  uuid: string
  /**
   * The unique identifier for the user. The value should be taken from the optimizelyEndUserId cookie, or it can be collected using window.optimizely.get('visitor').visitorId. If using the BYOID feature pass in the value of the ID for your user.
   */
  endUserId: string
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
     * If the event key should be converted to snake case before sending to Optimizely.
     */
    shouldSnakeCaseEventKey: boolean
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
   * The URL of the page where the event occurred. Used if Segment creates a Page in Optimizely.
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
   * The type of Segment event
   */
  eventType: string
  /**
   * Tags to send with the event
   */
  tags?: {
    /**
     * Currency code for revenue. Defaults to USD.
     */
    currency?: string
    [k: string]: unknown
  }
  /**
   * Standard event properties to send with the event.
   */
  standardEventProperties?: {
    /**
     * The revenue amount associated with this event For example, to represent $23.42, this field would be set to 23.42.
     */
    revenue?: number
    /**
     * A scalar value associated with an event. This should be some non-revenue number.
     */
    value?: number
    /**
     * An aggregatable "count" associated with this event; for example, a number of video views or items in a shopping cart.
     */
    quantity?: number
  }
  /**
   * Additioanl custom string event properties to send with the event. These must be defined in Optimizely before they can be sent.
   */
  customStringProperties?: {
    /**
     * Category of the event
     */
    Category?: string
    /**
     * Subcategory of the event
     */
    Subcategory?: string
    /**
     * Text of the event
     */
    Text?: string
    /**
     * URL of the event
     */
    URL?: string
    /**
     * SKU of the event
     */
    SKU?: string
    [k: string]: unknown
  }
  /**
   * Additioanl custom numeric event properties to send with the event. These must be defined in Optimizely before they can be sent.
   */
  customNumericProperties?: {
    [k: string]: unknown
  }
  /**
   * Additioanl custom boolean event properties to send with the event. These must be defined in Optimizely before they can be sent.
   */
  customBooleanProperties?: {
    [k: string]: unknown
  }
  /**
   * A unique identifier that identifies the session context, if any, for these events. If omitted, the Optimizely backend will calculate session-based results by inferring sessions by opening a session when an event is first received from a given visitor_id, and closing the session after 30 minutes with no events received for that visitor, with a maximum session size of 24 hours.
   */
  sessionId?: string
}
