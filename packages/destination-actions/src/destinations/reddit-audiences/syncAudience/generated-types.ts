// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * Segment's friendly name for the Audience
   */
  computation_key: string
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * The user's email address
   */
  email?: string
  /**
   * iOS Ad ID
   */
  iosIDFA?: string
  /**
   * Android Ad ID
   */
  androidIDFA?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.
   */
  enable_batching?: boolean
  /**
   * The maximum number of events to batch when sending data to Reddit.
   */
  batch_size?: number
}
