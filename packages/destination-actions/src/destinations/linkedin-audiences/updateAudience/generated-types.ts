// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The display name of the LinkedIn DMP Segment. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in LinkedIn.
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
   * The user's Google Advertising ID to send to LinkedIn.
   */
  google_advertising_id?: string
  /**
   * A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.
   */
  source_segment_id?: string
  /**
   * The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.
   */
  personas_audience_key: string
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * A Segment specific key used to define action type.
   */
  dmp_user_action?: string
}
