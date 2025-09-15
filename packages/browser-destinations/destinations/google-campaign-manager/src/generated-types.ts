// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * In Campaign Manager, go to Floodlight -> Configuration, and Advertiser ID is located under the Configuration heading.
   */
  advertiserId: string
  /**
   * This feature can be disabled if you do not want the global site tag to allow personalized remarketing data for site users.
   */
  allowAdPersonalizationSignals: boolean
  /**
   * This feature can be disabled if you do not want the global site tag to set first party cookies on your site domain.
   */
  conversionLinker: boolean
  /**
   * Set to true to enable Google’s [Consent Mode](https://support.google.com/analytics/answer/9976101?hl=en). Set to false by default.
   */
  enableConsentMode?: boolean
  /**
   * Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.
   */
  adUserDataConsentState?: string
  /**
   * Consent state indicated by the user for ad cookies. Value must be "granted" or "denied." This is only used if the Enable Consent Mode setting is on.
   */
  adPersonalizationConsentState?: string
  /**
   * The default value for ad cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.
   */
  defaultAdsStorageConsentState?: string
  /**
   * The default value for analytics cookies consent state. This is only used if Enable Consent Mode is on. Set to  “granted” if it is not explicitly set. Consent state can be updated for each user in the Set Configuration Fields action.
   */
  defaultAnalyticsStorageConsentState?: string
}
