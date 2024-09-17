// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The properties of the user or event.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * The ID of the user in Segment
   */
  user_id?: string
  /**
   * The Segment event type (identify, alias, etc.)
   */
  event_type?: string
  /**
   * When enabled, Segment will batch profiles together and send them to StackAdapt in a single request.
   */
  enable_batching: boolean
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'.
   */
  segment_computation_class?: string
  /**
   * For audience enter/exit events, this will be the audience ID.
   */
  segment_computation_id?: string
  /**
   * For audience enter/exit events, this will be the audience key.
   */
  segment_computation_key: string
  /**
   * The StackAdapt advertiser to add the profile to.
   */
  advertiser_id: string
}
