// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A identifier for a known user.
   */
  userId: string
  /**
   * An identifier for an anonymous user
   */
  anonymousId?: string
  /**
   * The email address for the user
   */
  email?: string
  /**
   * The name of the track() event or page() event
   */
  eventName: string
  /**
   * Properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
