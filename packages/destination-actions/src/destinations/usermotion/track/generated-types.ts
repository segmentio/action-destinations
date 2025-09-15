// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A identifier for a known user.
   */
  userId?: string
  /**
   * An identifier for an anonymous user
   */
  anonymousId?: string
  /**
   * The name of the track() event or page() event
   */
  eventName: string
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
