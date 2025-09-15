// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of event, page or screen
   */
  eventName?: string
  /**
   * The type of event
   */
  eventType?: string
  /**
   * Properties of the event
   */
  eventProperties?: {
    [k: string]: unknown
  }
  /**
   * User profile details / traits
   */
  userTraits?: {
    [k: string]: unknown
  }
  /**
   * User identifiers
   */
  identifiers?: {
    /**
     * Segment anonymous ID
     */
    anonymousId?: string
    /**
     * User ID
     */
    userId?: string
  }
}
