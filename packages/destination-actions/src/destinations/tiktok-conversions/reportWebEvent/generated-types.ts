// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to Tiktok "Web Event" section for accepted event names.
   */
  event?: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place. Timestamp with ISO 8601 format.
   */
  timestamp?: string
  /**
   * Override event type. Ex. "page".
   */
  type?: string
}
