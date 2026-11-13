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
   * The name of the event.
   */
  event: string
  /**
   * The unique ID of the Segment event.
   */
  messageId: string
  /**
   * The timestamp of the event.
   */
  timestamp: string | number
  /**
   * The unique identifier of the group the user belongs to.
   */
  groupId?: string
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
   * Properties of the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Send audience membership as a regular boolean trait or property named after the audience. Engage audiences are sent automatically. For Reverse ETL, enter an Audience Name.
   */
  audienceDetails?: {
    /**
     * The name of the trait or property to send. By default this is the Engage audience key, which is the snake_cased audience name. Enter a value to override it.
     */
    audienceName?: string
    /**
     * Whether the user is in the audience. If you leave this unset, Segment uses the Engage membership, or the Sync Mode for Reverse ETL.
     */
    audienceMembership?: boolean
  }
  /**
   * The key of the Engage audience. Used to avoid sending the audience twice when the name is overridden.
   */
  engageAudienceKey?: string
}
