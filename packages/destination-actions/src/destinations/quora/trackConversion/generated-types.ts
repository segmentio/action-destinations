// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The conversion event name sent to Quora.
   */
  event_name: string
  /**
   * The time the conversion occurred. Sent to Quora as epoch microseconds.
   */
  timestamp?: string | number
  /**
   * The Quora click ID (`qclid`), used to attribute the conversion to a specific ad click. Required by Quora for attribution.
   */
  click_id?: string
  /**
   * The monetary value associated with the conversion, in your account currency. Sent to Quora as a number, for example `99.99`. Do not include currency symbols or codes.
   */
  value?: number
  /**
   * A unique identifier for the event, used to deduplicate events sent via both the Conversions API and the Quora pixel.
   */
  event_id?: string
  /**
   * User identifiers and attributes. Sent to Quora as plaintext (not hashed).
   */
  user?: {
    /**
     * The user's email address.
     */
    email?: string
    /**
     * The user's full name.
     */
    name?: string
    /**
     * The user's phone number. E.164 format is preferred but not enforced.
     */
    phone_number?: string
    /**
     * The user's date of birth in ISO8601 format, for example, 2001-11-24.
     */
    date_of_birth?: string | number
    /**
     * The user's IP address.
     */
    ip?: string
    /**
     * The user's country as an ISO 3166-1 alpha-2 code (e.g. US).
     */
    country?: string
    /**
     * The user's state or region (e.g. California).
     */
    region?: string
    /**
     * The user's city.
     */
    city?: string
    /**
     * The user's postal code.
     */
    postal_code?: string
  }
  /**
   * Device identifiers and attributes.
   */
  device?: {
    /**
     * The advertising ID (IDFA on iOS, AAID on Android).
     */
    mobile_device_id?: string
    /**
     * The device user agent string.
     */
    user_agent?: string
    /**
     * The device locale string (e.g. en-US).
     */
    language?: string
    /**
     * The referring URL.
     */
    referrer?: string
  }
  /**
   * When enabled, Segment sends events to Quora in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
