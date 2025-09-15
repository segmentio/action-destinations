// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user performing the event.
   */
  user_id: string
  /**
   * The traits of the user.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will use batch requests to the Dawn AI API
   */
  enable_batching: boolean
}
