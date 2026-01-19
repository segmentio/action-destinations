// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event (e.g., "Trip Booked", "Lead Created").
   */
  eventName: string
  /**
   * Additional properties associated with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The unique identifier for the user.
   */
  userId?: string
  /**
   * An anonymous identifier when User ID is not available.
   */
  anonymousId?: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string | number
}
