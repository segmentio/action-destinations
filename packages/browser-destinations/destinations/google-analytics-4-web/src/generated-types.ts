// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The measurement ID associated with the web stream. Found in the Google Analytics UI under: Admin > Data Streams > Web > Measurement ID.
   */
  measurementID: string
  /**
   * Set to false to disable all advertising features. Set to true by default.
   */
  allowGoogleSignals?: boolean
  /**
   * Set to false to disable all advertising features. Set to true by default.
   */
  allowAdPersonalizationSignals?: boolean
  /**
   * Specifies the domain used to store the analytics cookie. Set to “auto” by default.
   */
  cookieDomain?: string
  /**
   * Every time a hit is sent to GA4, the analytics cookie expiration time is updated to be the current time plus the value of this field. The default value is two years (63072000 seconds). Please input the expiration value in seconds. More information in [Google Documentation](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#)
   */
  cookieExpirationInSeconds?: number
  /**
   * Appends additional flags to the analytics cookie.  See [write a new cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie#write_a_new_cookie) for some examples of flags to set.
   */
  cookieFlags?: string[]
  /**
   * Specifies the subpath used to store the analytics cookie.
   */
  cookiePath?: string[]
  /**
   * Specifies a prefix to prepend to the analytics cookie name.
   */
  cookiePrefix?: string[]
  /**
   * Set to false to not update  cookies on each page load. This has the effect of cookie expiration being relative to the first time a user visited. Set to true by default so update cookies on each page load.
   */
  cookieUpdate?: boolean
  /**
   * Set to true to enable Google’s [Consent Mode](https://support.google.com/analytics/answer/9976101?hl=en). Set to false by default.
   */
  enableConsentMode?: boolean
  /**
   * The default value for ad cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.
   */
  defaultAdsStorageConsentState?: string
  /**
   * The default value for analytics cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.
   */
  defaultAnalyticsStorageConsentState?: string
  /**
   * If your CMP loads asynchronously, it might not always run before the Google tag. To handle such situations, specify a millisecond value to control how long to wait before the consent state update is sent. Please input the wait_for_update in milliseconds.
   */
  waitTimeToUpdateConsentStage?: number
}
