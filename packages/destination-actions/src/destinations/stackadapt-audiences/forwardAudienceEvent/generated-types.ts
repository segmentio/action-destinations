// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The properties of the user.
   */
  traits?: {
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
   * The properties of the user or event.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * The email address of the user.
   */
  email: string
  /**
   * The ID of the user in Segment
   */
  user_id?: string
  /**
   * The Segment event type (identify or track)
   */
  event_type: string
  /**
   * When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.
   */
  enable_batching: boolean
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'.
   */
  segment_computation_class: string
  /**
   * For audience enter/exit events, this will be the audience ID.
   */
  segment_computation_id: string
  /**
   * For audience enter/exit events, this will be the audience key.
   */
  segment_computation_key: string
}
