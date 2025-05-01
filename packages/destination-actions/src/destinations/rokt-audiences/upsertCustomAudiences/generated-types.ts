// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of custom audience list to which emails should added/removed
   */
  custom_audience_name: string
  /**
   * Segment computation class used to determine if action is an 'Engage-Audience'
   */
  segment_computation_action: string
  /**
   * User's email address to be included/excluded from the custom audience.  One of either email_sha256 or email must be specified.
   */
  email?: string
  /**
   * User's SHA256-hashed email address to be included/excluded from the custom audience. One of either email_sha256 or email must be specified.
   */
  email_sha256?: string
  /**
   * Object which will be computed differently for track and identify events
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * Set as true to ensure Segment infrastructure uses batching when possible.
   */
  enable_batching?: boolean
}
