// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifiers for the user to be identified in Moengage. This can be a user ID, email, or any other unique identifier.
   */
  identifiers?: {
    /**
     * A unique identifier for the user.
     */
    user_id?: string
    /**
     * The email address of the user.
     */
    email?: string
    /**
     * The mobile number of the user.
     */
    mobile?: string
    [k: string]: unknown
  }
  /**
   * A dictionary of key-value pairs that will be sent as user attributes to Moengage.
   */
  attributes?: {
    /**
     * The first name of the user.
     */
    first_name?: string
    /**
     * The last name of the user.
     */
    last_name?: string
    /**
     * The email address of the user.
     */
    email?: string
    /**
     * The mobile number of the user.
     */
    mobile?: string
    /**
     * The username of the user.
     */
    username?: string
    /**
     * The gender of the user.
     */
    gender?: string
    /**
     * The birthday of the user in ISO 8601 format (YYYY-MM-DD).
     */
    birthday?: string
    [k: string]: unknown
  }
}
