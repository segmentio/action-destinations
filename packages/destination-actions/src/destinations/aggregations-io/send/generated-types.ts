// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Payload to deliver (JSON-encoded).
   */
  data?: {
    [k: string]: unknown
  }
  /**
   * Enabling sending batches of events to Aggregations.io.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower. If you know your events are large, you may want to tune your batch size down to meet API requirements.
   */
  batch_size?: number
}
