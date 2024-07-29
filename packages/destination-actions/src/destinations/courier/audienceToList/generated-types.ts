// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience ID to which user identifier should be added or removed
   */
  segment_audience_id: string
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  segment_audience_key: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * The Segment userId value.
   */
  segment_user_id?: string
  /**
   * The Segment anonymousId value.
   */
  segment_anonymous_id?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Indicates if the user will be added or removed from the Audience
   */
  audience_action?: string
}
