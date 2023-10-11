// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience name to which user identifier should be added or removed
   */
  segment_computation_key: string
  /**
   * Segment Audience ID to which user identifier should be added or removed
   */
  segment_computation_id: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * The user's unique ID
   */
  segment_user_id: string
}
