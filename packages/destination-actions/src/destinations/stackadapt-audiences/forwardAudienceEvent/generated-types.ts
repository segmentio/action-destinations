// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Standard properties for the user.
   */
  standard_traits?: {
    /**
     * The user's first name.
     */
    first_name?: string
    /**
     * The user's last name.
     */
    last_name?: string
    /**
     * The phone number of the user.
     */
    phone?: string
    /**
     * The address of the user.
     */
    address?: string
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
     * The timezone of the user.
     */
    timezone?: string
    /**
     * The postal code of the user.
     */
    postal_code?: string
    /**
     * The numeric birth day of the user. e.g 15 for the 15th of the month.
     */
    birth_day?: number
    /**
     * The numeric birth month of the user. e.g 6 for June.
     */
    birth_month?: number
    /**
     * The numeric birth year of the user. e.g 1990.
     */
    birth_year?: number
    /**
     * The birth date of the user in YYYY-MM-DD format. If set, overrides 'Birth Day', 'Birth Month' and 'Birth Year' fields.
     */
    birth_date?: string
  }
  /**
   * Custom properties for the user.
   */
  custom_traits?: {
    [k: string]: unknown
  }
  /**
   * The ID of the user in Segment
   */
  user_id?: string
  /**
   * The Segment event type - track or identify
   */
  event_type: string
  /**
   * In certain jurisdictions, explicit consent may be required to send email marketing communications to imported profiles. Consult independent counsel for further guidance.
   */
  marketing_status: string
  /**
   * When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.
   */
  enable_batching: boolean
  /**
   * The properties of the user or event.
   */
  traits_or_props: {
    [k: string]: unknown
  }
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
  /**
   * The email address of the user.
   */
  email: string
}
