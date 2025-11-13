// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Kinesis stream to send records to
   */
  streamName: string
  /**
   * The AWS region where the Kinesis stream is located
   */
  awsRegion: string
  /**
   * The partition key to use for the record
   */
  partitionKey: string
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
  /**
   * The maximum number of payloads to include in a batch.
   */
  max_batch_size: number
  /**
   * If true, Segment will batch events before sending to Kines.
   */
  enable_batching?: boolean
  /**
   * The number of bytes to write to the kinesis shard in a single batch. Limit is 1MB.
   */
  batch_bytes: number
}
