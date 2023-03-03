// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The LaunchDarkly context kind used for identified users. To learn more, read [Contexts and segments](https://docs.launchdarkly.com/home/contexts).
   */
  identified_context_kind: string
  /**
   * The user's unique key.
   */
  user_key: string
  /**
   * The LaunchDarkly context kind used for unauthenticated users. To learn more, read [Contexts and segments](https://docs.launchdarkly.com/home/contexts).
   */
  unauthenticated_context_kind: string
  /**
   * The user's unauthenticated identifier.
   */
  previous_key: string
  /**
   * The time when the event happened. Defaults to the current time.
   */
  timestamp?: string | number
}
