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
   * The contact's IP address
   */
  ip?: string | null
  /**
   * The contact's location. Will take priority over the IP address.
   */
  location?: {
    country?: string | null
    state?: string | null
    city?: string | null
    post_code?: string | null
  }
  /**
   * An object containing key-value pairs representing custom properties assigned to contact profile
   */
  traits?: {
    /**
     * The contact's email address
     */
    email?: string
    /**
     * The contact's phone number
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
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * The Audience to add the contact profile to. If set, the following audience name field will be ignored.
   */
  audience_id?: string
  /**
   * Enter the name of the audience you want to create in Ortto. Audience names are unique for each Segment data source. If a pre-existing Audience is selected, no new audience will be created.
   */
  name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the Ortto audience to which contacts will be synced.
   */
  id?: string
  /**
   * The name of the Ortto audience to which contacts will be synced.
   */
  name?: string
}
