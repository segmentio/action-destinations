// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Floodlight configuration ID associated with the conversion. Overrides the default Floodlight Configuration ID defined in Settings.
   */
  floodlightConfigurationId?: string
  /**
   * The Floodlight activity ID associated with the conversion. Overrides the default Floodlight Activity ID defined in Settings.
   */
  floodlightActivityId?: string
  /**
   * User details associated with the conversion.
   */
  userDetails?: {
    /**
     * The email address associated with the conversion.
     */
    email?: string
    /**
     * The phone number associated with the conversion.
     */
    phone?: string
    /**
     * The first name associated with the conversion.
     */
    firstName?: string
    /**
     * The last name associated with the conversion.
     */
    lastName?: string
    /**
     * The street address associated with the conversion.
     */
    streetAddress?: string
    /**
     * The city associated with the conversion.
     */
    city?: string
    /**
     * The state associated with the conversion.
     */
    state?: string
    /**
     * The postal code associated with the conversion.
     */
    postalCode?: string
    /**
     * The country code associated with the conversion.
     */
    countryCode?: string
  }
  /**
   * The Google Click ID (gclid) associated with the conversion.
   */
  gclid?: string
  /**
   * The Display Click ID (dclid) associated with the conversion.
   */
  dclid?: string
  /**
   * The encrypted user ID associated with the conversion.
   */
  encryptedUserId?: string
  /**
   * The mobile device ID associated with the conversion.
   */
  mobileDeviceId?: string
  /**
   * The timestamp of the conversion in a ISO-8601 string.
   */
  timestamp: string
  /**
   * The value of the conversion.
   */
  value: number
  /**
   * The quantity of the conversion.
   */
  quantity: string
  /**
   * The ordinal of the conversion. Use this field to control how conversions of the same user and day are de-duplicated.
   */
  ordinal: string
  /**
   * Whether Limit Ad Tracking is enabled. When set to true, the conversion will be used for reporting but not targeting. This will prevent remarketing.
   */
  limitAdTracking?: boolean
  /**
   * Whether this particular request may come from a user under the age of 13, under COPPA compliance.
   */
  childDirectedTreatment?: boolean
  /**
   * Whether the conversion was for a non personalized ad.
   */
  nonPersonalizedAd?: boolean
  /**
   * Whether this particular request may come from a user under the age of 16 (may differ by country), under compliance with the European Union's General Data Protection Regulation (GDPR).
   */
  treatmentForUnderage?: boolean
  /**
   * The match ID field. A match ID is your own first-party identifier that has been synced with Google using the match ID feature in Floodlight.
   */
  matchId?: string
  /**
   * The impression ID associated with the conversion.
   */
  impressionId?: string
  /**
   * User identifiers associated with the conversion. The maximum number of user identifiers for each conversion is 5.
   */
  userIdentifiers?: string[]
  /**
   * The user data consent status for the conversion.
   */
  adUserDataConsent?: string
  /**
   * The Merchant Center ID where the items are uploaded.
   */
  merchantId?: string
  /**
   * The feed labels associated with the feed where your items are uploaded. For more information, please refer to ​​ https://support.google.com/merchants/answer/12453549.
   */
  merchantFeedLabel?: string
  /**
   * The language associated with the feed where your items are uploaded. Use ISO 639-1 language codes. This field is needed only when item IDs are not unique across multiple Merchant Center feeds.
   */
  merchantFeedLanguage?: string
  /**
   * The items in the cart.
   */
  cartDataItems?: {
    /**
     * The item ID associated with the conversion.
     */
    itemId: string
    /**
     * The quantity of the item.
     */
    quantity: number
    /**
     * The value of the item.
     */
    unitPrice: number
  }
}
