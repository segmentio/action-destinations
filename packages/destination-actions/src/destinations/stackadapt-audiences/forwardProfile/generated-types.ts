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
     * The birth date of the user.
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
   * The user's previous ID, for alias events
   */
  previous_id?: string
  /**
   * The email address of the user.
   */
  email?: string
}
