// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string
  /**
   * Mobile screen name
   */
  name?: string
  /**
   * Properties to associate with the screen view
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the screen view
   */
  timestamp: string
  /**
   * The ID associated with the user
   */
  userId?: string
}
