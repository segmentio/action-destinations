// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  user_id: string
  /**
   * An anonymous user id
   */
  anonymous_id?: string
  /**
   * The event name
   */
  name: string
  /**
   * Object containing the properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event.
   */
  timestamp: string
}
