// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Floodlight configuration ID associated with the conversion.
   */
  floodlightConfigurationId?: string
  /**
   * The Floodlight activity ID associated with the conversion.
   */
  floodlightActivityId?: string
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
   * The timestamp of the conversion in microseconds.
   */
  timestampMicros: number
  /**
   * The value of the conversion.
   */
  value: number
  /**
   * The quantity of the conversion.
   */
  quantity: number
  /**
   * The ordinal value of the conversion.
   */
  ordinal?: number
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
   * User identifiers associated with the conversion. The maximum number of user identifiers for each conversion is 5.
   */
  userIdentifiers?: string[]
  /**
   * The user data consent status for the conversion.
   */
  adUserDataConsent?: string
}
