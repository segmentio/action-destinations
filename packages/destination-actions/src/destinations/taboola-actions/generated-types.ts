// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The client ID from your Taboola account.
   */
  client_id: string
  /**
   * The client's secret from your Taboola account.
   */
  client_secret: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The ID for the Taboola Account to sync to.
   */
  account_id: string
  /**
   * The time for which a given user will belong to this audience in hours.
   */
  ttl_in_hours?: number
  /**
   * Whether to exclude the audience from campaigns.
   */
  exclude_from_campaigns?: boolean
}
