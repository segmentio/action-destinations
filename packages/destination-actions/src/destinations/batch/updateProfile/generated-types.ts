// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User identifiers
   */
  identifiers: {
    /**
     * The unique profile identifier
     */
    custom_id: string
    [k: string]: unknown
  }
  /**
   * If enabled, the action will send multiple profiles in a single request. The maximum number of profiles in a single request is 200.
   */
  enable_batching?: boolean
  /**
   * Maximum number of attributes to include in each batch.
   */
  batch_size?: number
  /**
   * Attributes for the user profile
   */
  profileAttributes?: {
    /**
     * The profile's language. This can be sent as a locale (e.g., 'en-US') or a language code (e.g., 'en').
     */
    language?: string | null
    /**
     * The profile's email
     */
    email_address?: string | null
    /**
     * The profile's phone number
     */
    phone_number?: string | null
    /**
     * The profile's marketing emails subscription. Setting to 'reset' will reset the marketing emails subscription.
     */
    email_marketing?: string
    /**
     * Alternative boolean input. true → 'subscribed', false → 'unsubscribed'. If omitted, the string field is used.
     */
    email_marketing_bool?: boolean
    /**
     * The profile's marketing SMS subscription. Setting to 'reset' will reset the marketing SMS subscription.
     */
    sms_marketing?: string | null
    /**
     * Alternative boolean input. true → 'subscribed', false → 'unsubscribed'. If omitted, the string field is used.
     */
    sms_marketing_bool?: boolean
    /**
     * The profile's time zone name from IANA Time Zone Database (e.g., “Europe/Paris”). Only valid time zone values will be set.
     */
    timezone?: string | null
    /**
     * The profile's region. This can be sent as a locale (e.g., 'en-US') or a country code (e.g., 'US').
     */
    region?: string | null
    [k: string]: unknown
  }
  /**
   * The name of the event.
   */
  eventName?: string
  /**
   * An object containining the event's attributes
   */
  eventAttributes?: {
    [k: string]: unknown
  }
}
