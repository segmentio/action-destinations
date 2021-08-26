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
   * Alternative user ids if there is more than one identifier available, each prefixed with the identifier type and separated by commas
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
   * Time of when the actual event happened. If not set, timestamp recorded by 1plusX upon receipt is used.
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
   * If subject to CCPA, this field should be populated with appropriate consents. 1plusX will parse the string value and process the event only when the consent indicates no optout from sales. Leave blank or set to 1--- if not subject to CCPA.
   */
  ope_usp_string?: string
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
