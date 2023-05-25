// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The advertiser ID to use when syncing audiences.
   */
  selected_advertiser_id: string
  /**
   * Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in TikTok.Instead, updating the audience name here will create a separate audience in TikTok with the new audience name.
   */
  custom_audience_name?: string
  /**
   * Encryption type to be used for populating the audience. This field is set only when Segment creates a new audience.
   */
  id_type?: string
}
