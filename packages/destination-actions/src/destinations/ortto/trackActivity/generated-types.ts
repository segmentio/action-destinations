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
   * The Audience to add the associated contact profile to.
   */
  audience_id?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Enter the name of the audience you want to create in Ortto. Audience names are unique for each Segment data source. If a contact profile has an Audience field explicitly set, that value will take precedence.
   */
  name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The ID of the Ortto audience to which the associated contacts will be synced.
   */
  id?: string
  /**
   * The name of the Ortto audience to which the associated contacts will be synced.
   */
  name?: string
}
