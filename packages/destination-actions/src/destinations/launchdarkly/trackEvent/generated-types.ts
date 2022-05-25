// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's unique key.
   */
  user_key: string
  /**
   * The name of the event to track. This name typically corresponds to a LaunchDarkly metric with the same key.
   */
  event_name: string
  /**
   * The numeric value associated with the event. This value is used by the LaunchDarkly experimentation feature in numeric custom metrics, and will also be returned as part of the custom event for Data Export.
   */
  metric_value?: number
  /**
   * Optional object containing the properties for the event being tracked. These properties assist with observational analytics for LaunchDarkly Data Export destinations. These properties are not saved to the LaunchDarkly user.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * The time when the event happened. Defaults to the current time
   */
  timestamp?: string | number
}
