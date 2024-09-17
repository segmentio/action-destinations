// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A user identifier record the conversion against. Exactly one of Google Click ID, Display Click ID, Encrypted User ID, Mobile Device ID, Match ID, Impression ID or Encrypted User ID Candidates must be provided.
   */
  requiredId: {
    /**
     * The Google Click ID (gclid) associated with the conversion.
     */
    gclid?: string
    /**
     * The Display Click ID (dclid) associated with the conversion.
     */
    dclid?: string
    /**
     * The encrypted user ID associated with the conversion. If this field is set then 'Encryption Entity ID', 'Encryption Entity Type' and 'Encryption Source' should also be specified.
     */
    encryptedUserId?: string
    /**
     * The mobile device ID associated with the conversion.
     */
    mobileDeviceId?: string
    /**
     * The match ID field. A match ID is your own first-party identifier that has been synced with Google using the match ID feature in Floodlight.
     */
    matchId?: string
    /**
     * The impression ID associated with the conversion.
     */
    impressionId?: string
  }
  /**
   * The Floodlight configuration ID associated with the conversion. Overrides the default Floodlight Configuration ID defined in Settings.
   */
  floodlightConfigurationId?: string
  /**
   * The Floodlight activity ID associated with the conversion. Overrides the default Floodlight Activity ID defined in Settings.
   */
  floodlightActivityId?: string
  /**
   * The encryption information associated with the conversion. Required if Encrypted User ID or Encryption User ID Candidates fields are populated.
   */
  encryptionInfo?: {
    /**
     * The encryption entity ID. This should match the encryption type configuration for ad serving or Data Transfer.
     */
    encryptionEntityId: string
    /**
     * The encryption entity type. This should match the encryption type configuration for ad serving or Data Transfer.
     */
    encryptionEntityType: string
    /**
     * The encryption source. This should match the encryption type configuration for ad serving or Data Transfer.
     */
    encryptionSource: string
  }
  /**
   * User details associated with the conversion.
   */
  userDetails?: {
    /**
     * The user's email address. If unhashed, Segment will hash before sending to Campaign Manager 360.
     */
    email?: string
    /**
     * The user's phone number. If unhashed, Segment will hash before sending to Campaign Manager 360.
     */
    phone?: string
    /**
     * First name of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.
     */
    firstName?: string
    /**
     * Last name of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.
     */
    lastName?: string
    /**
     * The street address of the user. If unhashed, Segment will hash before sending to Campaign Manager 360.
     */
    streetAddress?: string
    /**
     * The user's city
     */
    city?: string
    /**
     * The user's state
     */
    state?: string
    /**
     * The user's postal code
     */
    postalCode?: string
    /**
     * 2-letter country code in ISO-3166-1 alpha-2 of the user's address.
     */
    countryCode?: string
  }
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
   * The user data consent status for the conversion.
   */
  adUserDataConsent?: string
  /**
   * The Merchant Center ID where the items are uploaded. Required if the cart data is provided.
   */
  merchantId?: string
  /**
   * The feed labels associated with the feed where your items are uploaded. Required if the cart data is provided. For more information, please refer to https://support.google.com/merchants/answer/12453549.
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
  }[]
}
