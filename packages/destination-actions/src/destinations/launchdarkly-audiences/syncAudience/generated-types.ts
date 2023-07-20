// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  custom_audience_name: string
  /**
   * Segment computation class used to determine if action is an 'Engage-Audience'
   */
  segment_computation_action: string
  /**
   * The event's context kind. If not specified, the context kind will default to `user`. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).
   */
  context_kind: string
  /**
   * The unique LaunchDarkly context key. In most cases the Segment `userId` should be used.
   */
  context_key: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
}
