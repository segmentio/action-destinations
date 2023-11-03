// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The key of the event to be tracked. This key must match the event key provided when the event was created in the Optimizely app.
   */
  eventKey: string
  /**
   * The ID of the user associated with the event being tracked. **Important**: This ID must match the user ID provided to Activate or Is Feature Enabled.
   */
  userId: string
  /**
   * A map of custom key-value string pairs specifying attributes for the user that are used for results segmentation.
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * An integer value that is used to track the revenue metric for your experiments, aggregated across all conversion events.
   */
  revenue?: number
  /**
   * A floating point value that is used to track a custom value for your experiments. Use this to pass the value for numeric metrics.
   */
  value?: number
  /**
   * A map of key-value pairs specifying tag names and their corresponding tag values for this particular event occurrence. Values can be strings, numbers, or booleans.
   *       These can be used to track numeric metrics, allowing you to track actions beyond conversions, for example: revenue, load time, or total value. See details on reserved tag keys.
   *
   */
  eventTags?: {
    [k: string]: unknown
  }
  /**
   * Timestamp of the event
   */
  timestamp: string | number
  /**
   * Unique ID for the event
   */
  uuid: string
}
