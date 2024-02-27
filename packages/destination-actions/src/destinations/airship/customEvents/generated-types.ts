// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User
   */
  named_user_id: string
  /**
   * Event Name
   */
  name: string
  /**
   * When the event occurred.
   */
  occurred: string | number
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If true, Segment will batch events before sending to Airship. Limit 100 events per request.
   */
  enable_batching?: boolean
}
