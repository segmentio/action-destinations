// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, events will be sent to Ortto in batches for improved efficiency.
   */
  enable_batching?: boolean
  /**
   * Creates a new contact profile if one does not already exist.
   */
  create_if_not_found?: boolean
  /**
   * The unique user identifier
   */
  user_id?: string
  /**
   * Anonymous user identifier
   */
  anonymous_id?: string
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
  /**
   * Specifies how to assign the contact's location
   */
  geo_mode?: string
  /**
   * The contact's IP address
   */
  ip?: string
  /**
   * The contact's location
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
    [k: string]: unknown
  }
}
