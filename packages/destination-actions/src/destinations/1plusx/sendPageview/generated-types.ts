// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's unique identifier, prefixed with the identifier type
   */
  ope_user_id: string
  /**
   * A description of the event
   */
  ope_event_type: string
  /**
   * Alternative user ids if there is more than one identifier available
   */
  ope_alt_user_ids?: string[]
  /**
   * The website URL of the page
   */
  ope_item_uri?: string
  /**
   * Version of the mobile app
   */
  ope_app_version?: string
  /**
   * Time of when the actual event happened
   */
  ope_event_time_ms?: string
  /**
   * The user agent as submitted by the browser
   */
  ope_user_agent?: string
  /**
   * Set to 1 if subject to GDPR, set to 0 or leave blank if not subject to GDPR
   */
  gdpr?: number
  /**
   * If subject to GDPR, populate with appropriate consents
   */
  gdpr_consent?: string
  /**
   * The platform that data is originating from
   */
  platform?: string
  /**
   * Custom fields to include with the event
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
