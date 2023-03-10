// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The LaunchDarkly context kind used for identified users. If not specified, the context kind will default to `user`. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).
   */
  identified_context_kind?: string
  /**
   * The user's unique key.
   */
  user_key: string
  /**
   * The LaunchDarkly context kind used for unauthenticated users. If not specified, the context kind will default to `unauthenticatedUser`. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).
   */
  unauthenticated_context_kind?: string
  /**
   * The user's unauthenticated identifier.
   */
  previous_key: string
  /**
   * The time when the event happened. Defaults to the current time.
   */
  timestamp?: string | number
}
