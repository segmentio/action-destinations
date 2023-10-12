// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience key / name
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
   * The user's email address
   */
  user_email?: string
}
