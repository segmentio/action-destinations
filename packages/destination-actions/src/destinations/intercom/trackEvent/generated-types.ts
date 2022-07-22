// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.
   */
  event_name: string
  /**
   * The time the event occurred as a UTC Unix timestamp. Segment will convert to Unix if not already converted.
   */
  created_at: string | number
  /**
   * Your identifier for the user who performed the event. User ID is required if no email is provided.
   */
  user_id?: string
  /**
   * The email address for the user who performed the event. Email is required if no User ID is provided.
   */
  email?: string
  id?: string
  /**
   * Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Intercom will ignore the rest. Intercom does not support nested JSON structures within metadata.
   */
  metadata?: {
    [k: string]: unknown
  }
}
