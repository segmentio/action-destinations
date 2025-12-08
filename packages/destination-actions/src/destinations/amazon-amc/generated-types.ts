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
   * Chose whether to sync audience to DSP or AMC. Defaults to DSP.
   */
  syncTo?: string
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
   * Advertiser ID when when syncing an Audience to Amazon Ads DSP
   */
  advertiserId?: string
  /**
   * AMC Instance ID used when syncing an audience to Amazon Marketing Cloud (AMC)
   */
  amcInstanceId?: string
  /**
   * AMC Account ID used when syncing an audience to Amazon Marketing Cloud (AMC)
   */
  amcAccountId?: string
  /**
   * AMC Account Marketplace ID used when syncing an audience to Amazon Marketing Cloud (AMC)
   */
  amcAccountMarketplaceId?: string
}
