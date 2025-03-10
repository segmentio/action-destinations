// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience ID to which user identifier should be added or removed
   */
  segment_audience_id?: string
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  segment_audience_key: string
  /**
   * Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' or 'journey_step' will be dropped before the perform() fuction call.
   */
  segment_computation_action: string
  /**
   * The user's email address. Required if phone is not provided.
   */
  email?: string
  /**
   * The user's phone number. Required if email is not provided.
   */
  phone?: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
}
