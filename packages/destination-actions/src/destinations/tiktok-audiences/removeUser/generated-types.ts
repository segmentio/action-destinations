// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The advertiser ID to use when syncing audiences.
   */
  selected_advertiser_id: string
  /**
   * Custom audience name of audience to be synced. This audience must already exist in your TikTok Advertising account
   */
  custom_audience_name: string
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
  /**
   * The `audience_key` of the Engage audience you want to sync to TikTok. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.
   */
  personas_audience_key?: string
}
