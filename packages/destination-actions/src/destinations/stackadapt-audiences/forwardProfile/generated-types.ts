// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The properties of the user.
   */
  traits?: {
    /**
     * The email address of the user.
     */
    email?: string
    /**
     * The user's first name.
     */
    firstName?: string
    /**
     * The user's last name.
     */
    lastName?: string
    /**
     * The phone number of the user.
     */
    phone?: string
    /**
     * The city of the user.
     */
    city?: string
    /**
     * The country of the user.
     */
    country?: string
    /**
     * The state of the user.
     */
    state?: string
    /**
     * The postal code of the user.
     */
    postalCode?: string
    /**
     * The birthday of the user.
     */
    birthday?: string
    [k: string]: unknown
  }
  /**
   * The ID of the user in Segment
   */
  user_id?: string
  /**
   * The user's previous ID, for alias events
   */
  previous_id?: string
  /**
   * The Segment event type (identify, alias, etc.)
   */
  event_type?: string
  /**
   * When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.
   */
  enable_batching: boolean
  /**
   * The StackAdapt advertiser to add the profile to.
   */
  advertiser_id: string
}
