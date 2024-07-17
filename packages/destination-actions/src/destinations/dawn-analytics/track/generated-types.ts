// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the action being performed.
   */
  event: string
  /**
   * The user ID performing the event.
   */
  user_id: string
  /**
   * The properties of the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
