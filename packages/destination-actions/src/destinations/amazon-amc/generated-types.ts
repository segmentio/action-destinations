// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Region for API Endpoint, either NA, EU, FE.
   */
  region: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The audience description. Must be an alphanumeric, non-null string between 0 to 1000 characters in length.
   */
  description: string
  /**
   * A String value representing ISO 3166-1 alpha-2 country code for the members in this audience.
   */
  countryCode: string
  /**
   * The user-defined audience identifier.
   */
  externalAudienceId: string
  /**
   * Cost per thousand impressions (CPM) in cents. For example, $1.00 = 100 cents.
   */
  cpmCents?: number
  /**
   * Currency code for the CPM value.
   */
  currency?: string
  /**
   * Time-to-live in seconds. The amount of time the record is associated with the audience.
   */
  ttl?: number
  /**
   * Advertiser Id
   */
  advertiserId: string
}
