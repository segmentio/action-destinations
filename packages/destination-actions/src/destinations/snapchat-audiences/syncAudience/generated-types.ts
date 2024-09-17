// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Segment Audience Key
   */
  segment_audience_key: string
  /**
   * Traits object
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * User's email address
   */
  email?: string
}
