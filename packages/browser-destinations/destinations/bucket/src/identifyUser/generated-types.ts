// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the User
   */
  userId: string
  /**
   * Additional information to associate with the User in Bucket
   */
  traits?: {
    /**
     * The User's full name
     */
    name?: string
    /**
     * The User's e-mail address
     */
    email?: string
    [k: string]: unknown
  }
}
