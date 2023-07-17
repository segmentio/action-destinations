// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for a user. See Google's [User-ID for cross-platform analysis](https://support.google.com/analytics/answer/9213390) and [Reporting: deduplicate user counts](https://support.google.com/analytics/answer/9355949?hl=en) documentation for more information on this identifier.
   */
  user_id?: string
  /**
   * The user properties to send to Google Analytics 4. You must create user-scoped dimensions to ensure custom properties are picked up by Google. See Google’s [Custom user properties](https://support.google.com/analytics/answer/9269570) to learn how to set and register user properties.
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.
   */
  ads_storage_consent_state?: string
  /**
   * Consent state indicated by the user for ad cookies. Value must be “granted” or “denied.” This is only used if the Enable Consent Mode setting is on.
   */
  analytics_storage_consent_state?: string
  /**
   * Use campaign content to differentiate ads or links that point to the same URL. Setting this value will override the utm_content query parameter.
   */
  campaign_content?: string
  /**
   * Use campaign ID to identify a specific campaign. Setting this value will override the utm_id query parameter.
   */
  campaign_id?: string
  /**
   * Use campaign medium to identify a medium such as email or cost-per-click. Setting this value will override the utm_medium query parameter.
   */
  campaign_medium?: string
  /**
   * Use campaign name to identify a specific product promotion or strategic campaign. Setting this value will override the utm_name query parameter.
   */
  campaign_name?: string
  /**
   * Use campaign source to identify a search engine, newsletter name, or other source. Setting this value will override the utm_source query parameter.
   */
  campaign_source?: string
  /**
   * Use campaign term to note the keywords for this ad. Setting this value will override the utm_term query parameter.
   */
  campaign_term?: string
  /**
   * Categorize pages and screens into custom buckets so you can see metrics for related groups of information. More information in [Google documentation](https://support.google.com/analytics/answer/11523339).
   */
  content_group?: string
  /**
   * The language preference of the user. If not set, defaults to the user's navigator.language value.
   */
  language?: string
  /**
   * The full URL of the page. If not set, defaults to the user's document.location value.
   */
  page_location?: string
  /**
   * The referral source that brought traffic to a page. This value is also used to compute the traffic source. The format of this value is a URL. If not set, defaults to the user's document.referrer value.
   */
  page_referrer?: string
  /**
   * The title of the page or document. If not set, defaults to the user's document.title value.
   */
  page_title?: string
  /**
   * The resolution of the screen. Format should be two positive integers separated by an x (i.e. 800x600). If not set, calculated from the user's window.screen value.
   */
  screen_resolution?: string
}
