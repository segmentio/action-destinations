// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to track
   */
  event_name: string
  /**
   * The distinct ID of the user
   */
  distinct_id: string
  /**
   * The properties of the event
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string | number
}
