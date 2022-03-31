// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The LaunchDarkly user key
   */
  user_key: string
  /**
   * The name of the event to track
   */
  event_name: string
  /**
   * The metric value
   */
  metric_value?: number
  /**
   * Object containing the properties for the event being tracked.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * Time of when the actual event happened.
   */
  timestamp?: string | number
}
