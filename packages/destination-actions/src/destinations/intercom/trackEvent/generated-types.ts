// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event. Names are treated as case insensitive. Periods (.) and dollars ($) in event names are replaced with hyphens.
   */
  event_name: string
  /**
   * A datetime in Unix timestamp format (seconds since Epoch).
   */
  created_at: string | number
  /**
   * The user's ID; required if no email provided.
   */
  user_id?: string
  /**
   * The user's email; required if no User ID provided.
   */
  email?: string
  /**
   * Metadata object describing the event. There is a limit to 10 keys. Intercom does not currently support nested JSON structures.
   */
  metadata?: {
    [k: string]: unknown
  }
}
