// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of custom audience list to which user identifier should added/removed
   */
  custom_audience_name: string
  /**
   * Segment computation class used to determine if action is an 'Engage-Audience'
   */
  segment_computation_action: string
  /**
   * LaunchDarkly context kind
   */
  context_kind: string
  /**
   * LaunchDarkly context key
   */
  context_key: string
  /**
   * Object which will be computed differently for track and identify events
   */
  traits_or_props: {
    [k: string]: unknown
  }
}
