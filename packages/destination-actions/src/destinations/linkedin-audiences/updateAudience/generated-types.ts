// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The display name of the LinkedIn DMP Segment.
   */
  dmp_segment_name?: string
  /**
   * Enable batching of requests to the LinkedIn DMP Segment.
   */
  enable_batching?: boolean
  /**
   * The user's email address to send to LinkedIn.
   */
  email?: string
  /**
   * Whether to send `email` to LinkedIn.
   */
  send_email?: boolean
  /**
   * The user's Google Advertising ID to send to LinkedIn.
   */
  google_advertising_id?: string
  /**
   * Whether to send Google Advertising ID to LinkedIn.
   */
  send_google_advertising_id?: boolean
  /**
   * A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.
   */
  source_segment_id?: string
  /**
   * The `audience_key` of the Personas audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.
   */
  personas_audience_key: string
  /**
   * The name of the current Segment event.
   */
  event_name?: string
}
