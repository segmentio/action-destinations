// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ChatGPT Ads website event to send. Select custom for an advertiser-defined event.
   */
  event_type: string
  /**
   * A stable ID for this event. Reuse it on retries and in Pixel when sending the same conversion.
   */
  event_id: string
  /**
   * Original event time as an ISO 8601 timestamp with timezone, or integer Unix milliseconds. Do not use the delivery time.
   */
  timestamp: string | number
  /**
   * The website URL where the event occurred. Credentials, query parameters and fragments are removed. Map a path without personal data.
   */
  source_url: string
  /**
   * Required for custom events. Use 1–64 letters, numbers, underscores or hyphens, starting and ending with a letter or number.
   */
  custom_event_name?: string
  /**
   * Map the advertiser opt-out signal: true, false, or null/absent for unspecified. This does not replace consent-based routing in Segment.
   */
  opt_out?: boolean | null
  /**
   * The existing OpenAI ad click reference. Pass the value unchanged.
   */
  oppref?: string
  /**
   * Event value. By default, use major currency units: 42.50 for USD 42.50. Set Amount Units to minor if the source already sends cents.
   */
  amount?: number
  /**
   * Applies to both the event value and item unit prices. Major converts using the currency; minor requires integers.
   */
  amount_units?: string
  /**
   * ISO 4217 currency code, such as USD. Required when Value is present.
   */
  currency?: string
  /**
   * Optional plan ID for subscription, trial, or custom events.
   */
  plan_id?: string
  /**
   * Products or content for commerce, page, subscription, trial, or custom events. Item price is a unit price, not a line total.
   */
  contents?: {
    /**
     * Product or content ID.
     */
    id?: string
    /**
     * Product group ID.
     */
    group_id?: string
    /**
     * Product or content name.
     */
    name?: string
    /**
     * Product or content type.
     */
    content_type?: string
    /**
     * Number of units.
     */
    quantity?: number
    /**
     * Price per item in the selected Amount Units.
     */
    amount?: number
    /**
     * ISO 4217 currency. Defaults to the event currency when absent.
     */
    currency?: string
    /**
     * Variant names and string values, such as color: blue.
     */
    variant_dict?: {
      [k: string]: unknown
    }
  }[]
  /**
   * Optional raw email. The connector trims, lowercases and hashes it before sending. Do not map an already hashed value here.
   */
  email?: string
  /**
   * Optional customer ID. The connector trims both ends, preserves case and hashes it before sending. Do not map an already hashed value here.
   */
  external_id?: string
  /**
   * Optional customer matching fields. Identity hashes must be prepared upstream. Use only data permitted by your consent rules.
   */
  user_data?: {
    /**
     * A lowercase, 64-character SHA-256 hash of the trimmed, lowercase email.
     */
    email_sha256?: string
    /**
     * A lowercase, 64-character SHA-256 hash of the customer ID, trimmed at both ends with case preserved.
     */
    external_id_sha256?: string
    /**
     * The customer IP address from the original event. Do not use the server IP.
     */
    ip_address?: string
    /**
     * The customer browser user agent from the original event.
     */
    user_agent?: string
    /**
     * The existing OpenAI browser reference. Pass the value unchanged.
     */
    obref?: string
    /**
     * Two-letter country code.
     */
    country?: string
    /**
     * Customer city.
     */
    city?: string
    /**
     * Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.
     */
    emails_sha256?: string[]
    /**
     * Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.
     */
    external_ids_sha256?: string[]
    /**
     * Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.
     */
    phone_numbers_sha256?: string[]
    /**
     * Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.
     */
    first_names_sha256?: string[]
    /**
     * Up to three lowercase, 64-character SHA-256 hashes. Normalize identifiers before hashing.
     */
    last_names_sha256?: string[]
    /**
     * Up to three customer geographic values.
     */
    countries?: string[]
    /**
     * Up to three customer geographic values.
     */
    cities?: string[]
    /**
     * Up to three customer geographic values.
     */
    regions?: string[]
    /**
     * Up to three customer geographic values.
     */
    postal_codes?: string[]
  }
  /**
   * Explicitly selected properties for custom events only. Do not include personal data or credentials here.
   */
  custom_properties?: {
    [k: string]: unknown
  }
}
