// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the conversion action associated with this conversion.
   */
  conversion_action: number
  /**
   * The Google click ID (gclid) associated with this conversion.
   */
  gclid?: string
  /**
   * The click identifier for clicks associated with app conversions and originating from iOS devices starting with iOS14.
   */
  gbraid?: string
  /**
   * The click identifier for clicks associated with web conversions and originating from iOS devices starting with iOS14.
   */
  wbraid?: string
  /**
   * The IP address of the user who initiated the conversion.
   */
  user_ip_address?: string
  /**
   * A base64url-encoded JSON string containing session attributes collected from the user's browser. Provides additional attribution context if gclid, gbraid, or user identifiers are missing.
   */
  session_attributes_encoded?: string
  /**
   * An alternative to the 'Session Attributes (Encoded)' field which can be used for Offline Conversions. If both 'Session Attributes (Encoded)' and 'Session Attributes (Key Value Pairs)' are provided, the encoded field takes precedence.
   */
  session_attributes_key_value_pairs?: {
    /**
     * An aggregate parameter served in the URL to identify the source of traffic originating from ads. See [Google's docs](https://support.google.com/google-ads/answer/16193746?sjid=2692215861659291994)
     */
    gad_source?: string
    /**
     * The ID of the specific ad campaign that drove the ad click. See [Google's docs](https://support.google.com/google-ads/answer/16193746?sjid=2692215861659291994)
     */
    gad_campaignid?: string
    /**
     * The full URL of the landing page on your website. This indicates the specific page the user first arrived on.
     */
    landing_page_url?: string
    /**
     * The timestamp of when the user's session began on your website. This helps track the duration of user visits. The format should be a full ISO 8601 string. For example "2025-11-18T08:52:17.023Z".
     */
    session_start_time_usec?: string
    /**
     * The URL of the webpage that linked the user to your website. This helps understand the traffic sources leading to your site. See [Google's docs](https://support.google.com/google-ads/answer/2382957?sjid=658827203196258052)
     */
    landing_page_referrer?: string
    /**
     * A string that identifies the user's browser and operating system. This information can be useful for understanding the technical environment of your users.
     */
    landing_page_user_agent?: string
  }
  /**
   * The date time at which the conversion occurred. Must be after the click time. The timezone must be specified. The format is "yyyy-mm-dd hh:mm:ss+|-hh:mm", e.g. "2019-01-01 12:32:45-08:00".
   */
  conversion_timestamp: string
  /**
   * Email address of the individual who triggered the conversion event
   */
  email_address?: string
  /**
   * The numeric country code to associate with the phone number. If not provided Segment will default to '+1'. If the country code does not start with '+' Segment will add it.
   */
  phone_country_code?: string
  /**
   * Phone number of the individual who triggered the conversion event, in E.164 standard format, e.g. +14150000000
   */
  phone_number?: string
  /**
   * The order ID associated with the conversion. An order ID can only be used for one conversion per conversion action.
   */
  order_id?: string
  /**
   * The value of the conversion for the advertiser.
   */
  value?: number
  /**
   * Currency associated with the conversion value. This is the ISO 4217 3-character currency code.
   */
  currency?: string
  /**
   * The environment this conversion was recorded on, e.g. APP or WEB. Sending the environment field requires an allowlist in your Google Ads account. Leave this field blank if your account has not been allowlisted.
   */
  conversion_environment?: string
  /**
   * The ID of the Merchant Center account where the items are uploaded.
   */
  merchant_id?: string
  /**
   * The ISO 3166 two-character region code of the Merchant Center feed where the items are uploaded.
   */
  merchant_country_code?: string
  /**
   * The ISO 639-1 language code of the Merchant Center feed where the items are uploaded.
   */
  merchant_language_code?: string
  /**
   * Sum of all transaction-level discounts, such as free shipping and coupon discounts for the whole cart.
   */
  local_cost?: number
  /**
   * Data of the items purchased.
   */
  items?: {
    /**
     * The ID of the item sold.
     */
    product_id?: string
    /**
     * Number of items sold.
     */
    quantity?: number
    /**
     * Unit price excluding tax, shipping, and any transaction level discounts.
     */
    price?: number
  }[]
  /**
   * The custom variables associated with this conversion. On the left-hand side, input the name of the custom variable as it appears in your Google Ads account. On the right-hand side, map the Segment field that contains the corresponding value See [Google’s documentation on how to create custom conversion variables.](https://developers.google.com/google-ads/api/docs/conversions/conversion-custom-variables)
   */
  custom_variables?: {
    [k: string]: unknown
  }
  /**
   * This represents consent for ad user data.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v21/Consent).
   */
  ad_user_data_consent_state?: string
  /**
   * This represents consent for ad personalization. This can only be set for OfflineUserDataJobService and UserDataService.For more information on consent, refer to [Google Ads API Consent](https://developers.google.com/google-ads/api/rest/reference/rest/v21/Consent).
   */
  ad_personalization_consent_state?: string
  /**
   * If true, Segment will batch events before sending to Google’s APIs. Google accepts batches of up to 2000 events.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size?: number
}
