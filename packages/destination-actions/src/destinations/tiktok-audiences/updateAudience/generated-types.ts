// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom audience name of audience to be created. Please note that names over 70 characters will be truncated to 67 characters with "..." appended. This field is set only when Segment creates a new audience.Updating this field after Segment has created an audience will not update the audience name in TikTok.
   */
  custom_audience_name?: string
  /**
   * Encryption type to be used for populating the audience.
   */
  id_type?: string
  /**
   * The user's email address to send to LinkedIn.
   */
  email?: string
  /**
   * The user's Google Advertising ID to send to LinkedIn.
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
}
