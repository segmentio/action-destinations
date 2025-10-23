// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the segment to create. This field is no longer used after the Segment is created in LinkedIn.
   */
  dmp_segment_name?: string
  /**
   * [Hidden] Enable batching of requests to the LinkedIn DMP Segment.
   */
  enable_batching?: boolean
  /**
   * The user's email address to send to LinkedIn.
   */
  email?: string
  /**
   * The user's first name to send to LinkedIn.
   */
  first_name?: string
  /**
   * The user's last name to send to LinkedIn.
   */
  last_name?: string
  /**
   * The user's title to send to LinkedIn.
   */
  title?: string
  /**
   * The user's company to send to LinkedIn.
   */
  company?: string
  /**
   * The user's country to send to LinkedIn. This field accepts an ISO standardized two letter country code e.g. US.
   */
  country?: string
  /**
   * The user's Google Advertising ID to send to LinkedIn.
   */
  google_advertising_id?: string
  /**
   * [Hidden] A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.
   */
  source_segment_id?: string
  /**
   * [Hidden] The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.
   */
  personas_audience_key?: string
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * Specifies if the user should be added or removed from the LinkedIn DMP User Segment.
   */
  dmp_user_action?: string
  /**
   * [Hidden] Batch key used to ensure a batch contains payloads from a single Audience only.
   */
  batch_keys?: string[]
}
