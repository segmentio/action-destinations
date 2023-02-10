// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in TikTok.
   */
  custom_audience_name?: string
  /**
   * Encryption type to be used for populating the audience.
   */
  id_type?: string
  /**
   * The user's email address to send to TikTok.
   */
  email?: string
  /**
   * The user's Google Advertising ID to send to TikTok.
   */
  google_advertising_id?: string
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
