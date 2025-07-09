// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier for user. Use `userId` or `anonymousId` from the Segment event.
   */
  contact_id: string
  /**
   * Name of the event. Use `event` from the Segment event.
   */
  event_name: string
  /**
   * Timestamp for when the event happened.
   */
  time: string
  /**
   * User’s local timezone.
   */
  timezone?: string
  /**
   * Event properties.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Unique identifier for the event.
   */
  event_id?: string
}
