// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Audience ID in Google's DB.
   */
  external_audience_id: string
  /**
   * Segment Audience ID to which user identifier should be added or removed
   */
  segment_audience_id: string
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  segment_computation_key: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * The user's email address
   */
  user_email?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.
   */
  enable_batching: boolean
  /**
   * Mobile Device ID.
   */
  device_id?: string
  /**
   * Max Batch size to send to Taboola.
   */
  batch_size: number
}
