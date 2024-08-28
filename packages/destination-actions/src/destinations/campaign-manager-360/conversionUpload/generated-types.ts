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
  quantity: number
  /**
   * The ordinal of the conversion. Use this field to control how conversions of the same user and day are de-duplicated.
   */
  ordinal?: number
  /**
   * Custom variables associated with the conversion.
   */
  customVariables?: {
    /**
     * The type of the custom variable.
     */
    type: string
    /**
     * The value of the custom variable.
     */
    value: string
    /**
     * The kind of the custom variable.
     */
    kind?: string
  }[]
  /**
   * Whether Limit Ad Tracking is enabled. When set to true, the conversion will be used for reporting but not targeting. This will prevent remarketing.
   */
  limitAdTracking?: boolean
  /**
   * Whether this particular request may come from a user under the age of 13, under COPPA compliance.
   */
  childDirectedTreatment?: boolean
  /**
   * A comma separated list of the alphanumeric encrypted user IDs. Any user ID with exposure prior to the conversion timestamp will be used in the inserted conversion. If no such user ID is found then the conversion will be rejected with INVALID_ARGUMENT error. When set, `encryptionInfo` should also be specified.
   */
  encryptedUserIdCandidates?: string
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
   * The user data consent status for the conversion.
   */
  adUserDataConsent?: string
  /**
   * A Description of how user IDs are encrypted.
   */
  encryptionInfo?: {
    /**
     * The encryption entity type. This should match the encryption type configuration for ad serving or Data Transfer.
     */
    encryptionEntityType: string
    /**
     * The encryption entity ID. This should match the encryption configuration for ad serving or Data Transfer.
     */
    encryptionEntityId: string
    /**
     * Describes whether the encrypted cookie was received from ad serving (the %m macro) or from Data Transfer.
     */
    encryptionSource: string
    /**
     * Identifies what kind of resource this is. Value: the fixed string
     */
    kind: string
  }
}
