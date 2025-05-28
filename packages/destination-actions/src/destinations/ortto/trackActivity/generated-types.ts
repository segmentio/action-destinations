// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Event timestamp (ISO 8601)
   */
  timestamp: string
  /**
   * Message ID
   */
  message_id: string
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
   * The IP address of the location where the activity occurred.
   */
  ip?: string | null
  /**
   * The location where the activity occurred. Takes priority over the IP address.
   */
  location?: {
    country?: string | null
    state?: string | null
    city?: string | null
    post_code?: string | null
  }
  /**
   * key-value custom property pairs to be assigned to the Contact's profile
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Indicates whether the Contact should be added to or removed from the Audience.
   */
  audience_update_mode?: string
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size?: number
  /**
   * Event name
   */
  event: string
  /**
   * Event namespace
   */
  namespace?: string
  /**
   * An object containing key-value pairs representing activity attributes
   */
  properties?: {
    [k: string]: unknown
  }
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveInputs {
  /**
   * The name of the Ortto Audience to link the Contact to.
   */
  audience_name?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveOutputs {
  /**
   * The ID of the Ortto Audience Contacts will be linked to.
   */
  audience_id?: string
  /**
   * The name of the Ortto Audience contacts will be linkted to.
   */
  audience_name?: string
}
