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
  /**
   * The Audience ID is used to synchronize your Engage audience with TikTok. If you haven't created a TikTok Audience yet, you can leave this field empty, and Segment will generate one for you automatically.
   */
  audience_id?: string
  /**
   * The user's email address to send to TikTok.
   */
  email?: string
  /**
   * The user's mobile advertising ID to send to TikTok. This could be a GAID, IDFA, or AAID
   */
  advertising_id?: string
  /**
   * Send email to TikTok. Segment will hash this value before sending
   */
  send_email?: boolean
  /**
   * Send mobile advertising ID (IDFA, AAID or GAID) to TikTok. Segment will hash this value before sending.
   */
  send_advertising_id?: boolean
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * Enable batching of requests to the TikTok Audiences.
   */
  enable_batching?: boolean
}
