// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The advertiser ID to use when syncing audiences.
   */
  selected_advertiser_id: string
  /**
   * Audience ID for the TikTok Audience you want to sync your Engage audience to. This is returned after you create an audience and can also be found in the TikTok Audiences dashboard.
   */
  audience_id: string
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
