// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ChatGPT Conversions API event type to send. Custom events also require a Custom Event Name.
   */
  event_type: string
  /**
   * The name of the custom event. Letters, digits, underscores and hyphens only, starting and ending with a letter or digit. It is lowercased, and must not match a standard event type.
   */
  custom_event_name?: string
  /**
   * A unique ID for the event, used for deduplication. Reuse the Measurement Pixel event ID so browser and server events are deduplicated, and so retries are not counted twice.
   */
  event_id: string
  /**
   * When the event occurred. ChatGPT Conversions API rejects events more than 7 days old or more than 10 minutes in the future.
   */
  timestamp: string | number
  /**
   * Where the conversion happened. Defaults to Web when the event has a page URL, otherwise Other. App Installed and App Opened events must use Mobile App.
   */
  action_source: string
  /**
   * The URL of the page where the event occurred, including scheme and host. Required when Action Source is Web. Optional for all other Action Sources.
   */
  source_url?: string
  /**
   * The oppref click ID from the landing page URL. It is sent unchanged. The ChatGPT Conversions API browser plugin captures it in the browser and adds it to every later event.
   */
  oppref?: string
  /**
   * When true, opts the user out of future user-level personalization.
   */
  opt_out?: boolean
  /**
   * The total value of the event. Provide it as a decimal number in the currency major unit, for example 100.05 for $100.05. Segment converts it to integer minor units (cents) before sending to ChatGPT Conversions API, so 100.05 USD is sent as 10005. Do not pre-convert it to minor units.
   */
  amount?: number
  /**
   * The ISO 4217 currency code of the amount, for example USD. Required when Amount is provided. Optional when there is no Amount.
   */
  currency?: string
  /**
   * The ID of the plan for subscription, trial and custom events.
   */
  plan_id?: string
  /**
   * The items involved in the event. Not available for appointment, lead, registration and app events. Item amounts are per unit. Any additional keys you add to an item, such as size or color, are sent to ChatGPT Conversions API as variant attributes, and their values are converted to strings. Do not use id, group_id, name, content_type, quantity, amount or currency as variant keys.
   */
  contents?: {
    /**
     * Your internal ID for the item.
     */
    id?: string
    /**
     * The product group or category ID of the item.
     */
    group_id?: string
    /**
     * A human readable name for the item.
     */
    name?: string
    /**
     * A category for the item, for example product, plan or page.
     */
    content_type?: string
    /**
     * The number of units. Sent as an integer.
     */
    quantity?: number
    /**
     * The price of one unit. Provide it as a decimal number in the currency major unit, for example 19.99 for $19.99. Segment converts it to integer minor units (cents) before sending to ChatGPT Conversions API, so 19.99 USD is sent as 1999.
     */
    amount?: number
    /**
     * The ISO 4217 currency code of the item amount. Defaults to the event currency.
     */
    currency?: string
    [k: string]: unknown
  }[]
  /**
   * Identifiers and user details that help ChatGPT Conversions API match the event to a user. At least one of Email, Phone or Android Advertising ID is recommended, but events are still delivered without them. Matching works best when more details are sent together.
   */
  user?: {
    /**
     * The user's email addresses, up to 3, for example jane@example.com. Segment trims each one, lowercases it and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is. Any values after the first 3 are ignored.
     */
    email?: string[]
    /**
     * The user's phone numbers with country code, up to 3, for example +14155550123 (8 to 15 digits). Segment removes spaces, brackets, dots, dashes and a leading + or zeros from each one, then SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is. Any values after the first 3 are ignored.
     */
    phone?: string[]
    /**
     * The user's Android Google Advertising ID (GAID) as a 36 character UUID, for example 123e4567-e89b-12d3-a456-426614174000. Sent unhashed. IDFA is not supported.
     */
    android_advertising_id?: string
    /**
     * The user's OpenAI browser reference (obref) value. Sent unhashed. The ChatGPT Conversions API browser plugin reads it from the __obref cookie, which requires the user's measurement consent. Falls back to the anonymous ID.
     */
    obref?: string
    /**
     * Your own ID for the user, for example a user ID. Segment trims it and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.
     */
    external_id?: string
    /**
     * The user's browser user agent string. Sent unhashed.
     */
    user_agent?: string
    /**
     * The user's IPv4 or IPv6 address, for example 203.0.113.7. Sent unhashed. An invalid address causes the event to be rejected.
     */
    ip_address?: string
    /**
     * The user's first name. Segment lowercases it, removes spaces and punctuation, and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.
     */
    first_name?: string
    /**
     * The user's last name. Segment lowercases it, removes spaces and punctuation, and SHA-256 hashes it. A SHA-256 hash (64 hex characters) is sent as is.
     */
    last_name?: string
    /**
     * The user's city as plain text, for example San Francisco. Sent unhashed. Maximum 128 characters.
     */
    city?: string
    /**
     * The user's state or region as plain text, for example California or CA. Sent unhashed. Maximum 128 characters.
     */
    region?: string
    /**
     * The user's two letter ISO 3166-1 alpha-2 country code, for example US. Sent unhashed. An unrecognized code causes the event to be rejected.
     */
    country?: string
    /**
     * The user's postal or ZIP code as plain text, for example 94105. Sent unhashed. Maximum 32 characters.
     */
    postal_code?: string
  }
  /**
   * When enabled, Segment sends events to ChatGPT Conversions API in batches.
   */
  enable_batching?: boolean
  /**
   * The maximum number of events to send in each batch.
   */
  batch_size?: number
}
