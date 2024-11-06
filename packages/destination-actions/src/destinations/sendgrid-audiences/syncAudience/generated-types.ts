// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Segment Audience key
   */
  segment_audience_key: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * The contact's email address.
   */
  primary_email: string
  /**
   * When enabled, the action will batch events before sending them to Sendgrid.
   */
  enable_batching: boolean
  /**
   * The maximum number of events to batch when sending data to Reddit.
   */
  batch_size?: number
}
