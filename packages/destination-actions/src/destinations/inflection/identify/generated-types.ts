// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the user.
   */
  userId: string
  /**
   * The Segment anonymous ID of the user.
   */
  anonymousId?: string
  /**
   * The unique ID of the Segment event.
   */
  messageId: string
  /**
   * The timestamp of the event.
   */
  timestamp: string | number
  /**
   * The email address of the user.
   */
  email: string
  /**
   * How to send objects and arrays nested inside the properties or traits.
   */
  nestedValueHandling?: {
    /**
     * Stringify sends the object as a JSON string. Flatten sends one field per key, named parent_key (for example address_city).
     */
    objectHandling?: string
    /**
     * Stringify sends the array as a JSON string. Flatten sends one field per item, named parent_0, parent_1. Join sends a single comma-separated string.
     */
    arrayHandling?: string
  }
  /**
   * Traits of the user.
   */
  traits?: {
    [k: string]: unknown
  }
}
