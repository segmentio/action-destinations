// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A distinct ID of an identified (logged in) user.
   */
  userId: string
  /**
   * Properties to set on the user profile
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The type of the event
   */
  type: string
}
