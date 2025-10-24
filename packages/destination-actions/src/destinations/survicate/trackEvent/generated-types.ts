// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId?: string
  /**
   * An anonymous user id
   */
  anonymousId?: string
  /**
   * The name of the event
   */
  name: string
  /**
   * Object containing the properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event.
   */
  timestamp: string
}
