// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The data to send to Kinesis. JSON-serialized and base64-encoded before sending. Output depends entirely on the mapping created.
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * Determines which shard in the stream the data record is assigned to. Default: messageId. Recommend choosing a partition key with low throughput (e.g. user_id).
   */
  partitionKey?: string
  /**
   * The name of the destination Kinesis stream.
   */
  streamName: string
  /**
   * The AWS region of the destination Kinesis stream.
   */
  region: string
  /**
   * (Hidden field): Enable Batching
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
