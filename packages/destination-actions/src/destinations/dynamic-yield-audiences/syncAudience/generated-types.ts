// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment event message ID
   */
  message_id: string
  /**
   * Segment event timestamp
   */
  timestamp: string | number
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Segment Audience key / name
   */
  segment_audience_key: string
  /**
   * Traits or Properties object
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * User's email address
   */
  email?: string
  /**
   * User's anonymousId
   */
  anonymousId?: string
  /**
   * User's unique User ID
   */
  userId?: string
}
