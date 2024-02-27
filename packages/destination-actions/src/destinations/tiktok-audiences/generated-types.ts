// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Advertiser IDs where audiences should be synced. Hidden in production and should not be altered by users.
   */
  advertiser_ids?: string[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The advertiser ID to use when syncing audiences. Required if you wish to create or update an audience.
   */
  advertiserId?: string
  /**
   * Encryption type to be used for populating the audience. This field is required and only set when Segment creates a new audience.
   */
  idType?: string
}
