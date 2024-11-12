// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event being performed.
   */
  event_name: string
  /**
   * The unique user identifier set by you
   */
  source_id: string
  /**
   * An object of key-value pairs that represent event properties to be sent along with the event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
