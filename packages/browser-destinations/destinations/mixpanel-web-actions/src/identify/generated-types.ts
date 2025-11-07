// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique ID to associate with the user.
   */
  unique_id: string
  /**
   * User Profile Properties to set on the user profile in Mixpanel.
   */
  profile_properties_to_set?: {
    /**
     * The name of the user.
     */
    name?: string
    /**
     * The first name of the user.
     */
    first_name?: string
    /**
     * The last name of the user.
     */
    last_name?: string
    /**
     * The email of the user.
     */
    email?: string
    /**
     * The phone number of the user.
     */
    phone?: string
    /**
     * The avatar URL of the user.
     */
    avatar?: string
    /**
     * The creation date of the user profile.
     */
    created?: string
    [k: string]: unknown
  }
  /**
   * User Profile Properties to set once on the user profile in Mixpanel. Values which get set once cannot be overwritten later.
   */
  profile_properties_to_set_once?: {
    [k: string]: unknown
  }
  /**
   * User Profile Properties to increment on the user profile in Mixpanel. Values must be numeric.
   */
  profile_properties_to_increment?: {
    [k: string]: unknown
  }
}
