// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Static List that users will be synced to.
   */
  external_id: string
  email?: {
    [k: string]: unknown
  }
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * The name of the current Segment event.
   */
  event_name: string
}
