/**
 * Generated Types for Track Event Action
 */

export interface Payload {
  /**
   * The name of the event (e.g., "Trip Booked", "Lead Created").
   */
  eventName: string

  /**
   * Additional properties associated with the event.
   */
  properties?: Record<string, unknown>

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
