// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user performing the event.
   */
  user_id: string
  /**
   * An anonymous identifier
   */
  anonymous_id?: string
  /**
   * The traits of the user.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string
}
