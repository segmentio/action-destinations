// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the LinkedIn DMP Segment to update.
   */
  dmp_segment_name: string
  /**
   * Enable batching of requests to the DMP Segment.
   */
  enable_batching?: boolean
  /**
   * Whether to send a SHA-256 hash of users' email address to LinkedIn.
   */
  send_email_address?: boolean
  /**
   * Whether to send each user's Google Advertising ID (GAID) to LinkedIn. GAID is sometimes referred to as Android Advertising ID.
   */
  send_google_advertising_id?: boolean
}
