// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the LinkedIn DMP Segment.
   */
  dmp_segment_name: string
  /**
   * Enable batching of requests to the DMP Segment.
   */
  enable_batching?: boolean
  /**
   * The user's email address to send to LinkedIn.
   */
  email?: string
  /**
   * The user's email address to send to LinkedIn.
   */
  google_advertising_id?: string
  /**
   * A Segment-specific key associated with the DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API_VERSION.
   */
  source_segment_id?: string
  /**
   * The `audience_key` of the Personas audience.
   */
  personas_audience_key: string
  /**
   * The name of the current Segment event.
   */
  event_name?: string
}
