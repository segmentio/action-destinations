// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom audience name of audience to be synced. This audience must already exist in your TikTok Advertising account
   */
  custom_audience_name: string
  /**
   * The advertiser ID to use when syncing audiences.
   */
  selected_advertiser_id: string
  /**
   * Encryption type to be used for populating the audience. This field is set only when Segment creates a new audience.
   */
  id_type: string
}
