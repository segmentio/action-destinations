// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Event timestamp
   */
  timestamp?: string
  /**
   * Message ID
   */
  message_id?: string
  /**
   * The unique user identifier
   */
  user_id?: string
  /**
   * Anonymous user identifier
   */
  anonymous_id?: string
  /**
   * When enabled, events will be sent to Ortto in batches for improved efficiency.
   */
  enable_batching?: boolean
  /**
   * Event namespace
   */
  namespace?: string
  /**
   * Event name
   */
  event: string
  /**
   * An object containing key-value pairs representing activity attributes
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The IP address of the location where the activity occurred.
   */
  ip?: string | null
  /**
   * The location where the activity occurred. Will take priority over the IP address.
   */
  location?: {
    country?: string | null
    state?: string | null
    city?: string | null
    post_code?: string | null
  }
  /**
   * When provided, it contains key-value pairs representing custom properties assigned to the associated contact profile
   */
  traits?: {
    /**
     * The contact's email address
     */
    email?: string
    /**
     * The contact's phone number (including the country code is strongly recommended)
     */
    phone?: string
    /**
     * The contact's first name
     */
    first_name?: string
    /**
     * The contact's last name
     */
    last_name?: string
  }
  /**
   * Indicates whether the contact should be added to or removed from the audience.
   */
  audience_update_mode?: string
  /**
   * Defines how the contact should be synced with an Ortto audience
   */
  audience?: {
    /**
     * Audience update mode (add/remove)
     */
    mode?: string
    /**
     * Ortto audience ID
     */
    id?: string
  }
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Enter the name of the audience in Ortto. Audience names are unique per Segment data source
   */
  audience_name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the Ortto audience to which contacts will be synced.
   */
  audience_id?: string
  /**
   * The name of the Ortto audience to which contacts will be synced.
   */
  audience_name?: string
}
