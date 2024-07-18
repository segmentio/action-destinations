// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string
  /**
   * Event name
   */
  event?: string
  /**
   * Properties to associate with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp: string
  /**
   * The ID associated with the user
   */
  userId?: string
}
