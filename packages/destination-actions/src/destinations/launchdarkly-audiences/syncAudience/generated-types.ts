// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience key to which user identifier should be added or removed
   */
  segment_audience_key: string
  /**
   * Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.
   */
  segment_computation_action: string
  /**
   * The event's context kind. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).
   */
  context_kind: string
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
  /**
   * The unique LaunchDarkly context key. In most cases the Segment UserId should be used.
   */
  context_key: string
  /**
   * A computed object for track and identify events. This field should not need to be edited.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.
   */
  enable_batching?: boolean
  /**
   * Indicates if the user will be added or removed from the Audience
   */
  audience_action?: string
}
