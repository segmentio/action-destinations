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
     * URL to an avatar image for the user
     */
    avatar?: string
    /**
     * Company the user represents. Should contain: name (String), id (String or Number)
     */
    company?: {
      [k: string]: unknown
    }
    /**
     * Date the user's account was first created. Segment recommends using ISO-8601 date strings
     */
    createdAt?: string
    /**
     * A distinct identifier of the user in your application.
     */
    id?: string
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
