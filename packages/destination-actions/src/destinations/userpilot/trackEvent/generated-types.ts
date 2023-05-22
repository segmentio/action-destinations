// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the logged-in user.
   */
  userId?: string
  /**
   * Anonymous user ID.
   */
  anonymousId?: string
  /**
   * Event name
   */
  name: string
  /**
   * Event properties
   */
  properties?: {
    [k: string]: unknown
  }
}
