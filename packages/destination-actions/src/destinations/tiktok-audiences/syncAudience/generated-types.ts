// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * Send email to TikTok. Segment will hash this value before sending
   */
  send_email?: boolean
  /**
   * Send phone number to TikTok. Segment will hash this value before sending
   */
  send_phone?: boolean
  /**
   * Send mobile advertising ID (IDFA, AAID or GAID) to TikTok. Segment will hash this value before sending.
   */
  send_advertising_id?: boolean
  /**
   * The user's email address to send to TikTok.
   */
  email?: string
  /**
   * The user's phone number to send to TikTok.
   */
  phone?: string
  /**
   * The user's mobile advertising ID to send to TikTok. This could be a GAID, IDFA, or AAID
   */
  advertising_id?: string
  /**
   * Enable batching of requests to the TikTok Audiences.
   */
  enable_batching?: boolean
  /**
   * The Audience ID in TikTok's DB.
   */
  external_audience_id?: string
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
