// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * A unique identifier for the user.
   */
  userId?: string
  /**
   * An anonymous identifier for the user.
   */
  anonymousId?: string
  /**
   * Information associated with the event
   */
  properties?: {
    [k: string]: unknown
  }
}
