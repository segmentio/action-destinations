// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event data to send as the Kinesis record payload. Maps the entire Segment event by default.
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * The name of the Kinesis stream to put the data record into.
   */
  streamName: string
  /**
   * Determines which shard in the stream the data record is assigned to. Defaults to messageId for even distribution. Use userId or anonymousId for user-level ordering.
   */
  partitionKey: string
  /**
   * The AWS region where the Kinesis stream is located.
   */
  awsRegion: string
  /**
   * Enable batching of records using PutRecords API.
   */
  enable_batching: boolean
  /**
   * Maximum number of records to include in each PutRecords request. Kinesis API limit is 500.
   */
  batch_size?: number
  /**
   * Fields used to group events into separate batches. Events with different values for these fields will be sent in different batches.
   */
  batch_keys?: string[]
  /**
   * Framework-level cap on how many events can be in a single batch. Must not exceed 500 (Kinesis PutRecords limit).
   */
  max_batch_size: number
  /**
   * Maximum total bytes per batch. Kinesis limits each PutRecords call to 1MB.
   */
  batch_bytes: number
}
