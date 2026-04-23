// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event data to send as the SQS message body. Maps the entire Segment event by default.
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * The URL of the SQS queue to send messages to. Format: https://sqs.<region>.amazonaws.com/<account-id>/<queue-name>
   */
  queueUrl: string
  /**
   * The AWS region where the SQS queue is located.
   */
  awsRegion: string
  /**
   * Required for FIFO queues. Specifies the message group for ordering. Recommended: userId or anonymousId for user-level ordering.
   */
  messageGroupId?: string
  /**
   * Used for FIFO queues with content-based deduplication disabled. Defaults to Segment messageId.
   */
  messageDeduplicationId?: string
  /**
   * The number of seconds to delay message delivery (0-900). Only applies to Standard queues.
   */
  delaySeconds?: number
  /**
   * Enable batching of messages using SendMessageBatch API.
   */
  enable_batching: boolean
  /**
   * Maximum number of messages per SendMessageBatch request. SQS API limit is 10.
   */
  batch_size?: number
  /**
   * Fields used to group events into separate batches. Events targeting different queues/regions are batched separately.
   */
  batch_keys?: string[]
  /**
   * Framework-level cap on batch size. Must not exceed 10 (SQS SendMessageBatch limit).
   */
  max_batch_size: number
  /**
   * Maximum total bytes per batch. SQS limits each SendMessageBatch to 1MB (1,048,576 bytes).
   */
  batch_bytes: number
}
