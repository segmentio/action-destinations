// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of custom audience to add or remove the user from
   */
  custom_audience_name: string
  /**
   * Segment computation class used to determine payload is for an Audience
   */
  segment_computation_action: string
  /**
   * Segment computation ID
   */
  segment_computation_id: string
  /**
   * The user identifier to sync to the Optimizely Audience
   */
  optimizelyUserId: string
  /**
   * Timestamp indicates when the user was added or removed from the Audience
   */
  timestamp: string
}
