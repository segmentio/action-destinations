// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to track
   */
  event_name: string
  /**
   * The distinct ID of the user
   */
  distinct_id: string
  /**
   * The properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * To capture [anonymous events](https://posthog.com/docs/data/anonymous-vs-identified-events), set this field to `true`
   */
  anonymous_event_capture: boolean
  /**
   * The timestamp of the event
   */
  timestamp?: string | number
  /**
   * If enabled, this action will be batched and processed in bulk.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
