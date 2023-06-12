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
    /**
     * The user's name
     */
    name?: string
    /**
     * The user's email
     */
    email?: string
    [k: string]: unknown
  }
  /**
   * The type of the event
   */
  type: string
}
