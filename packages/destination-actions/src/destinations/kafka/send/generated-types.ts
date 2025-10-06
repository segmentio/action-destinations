// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Kafka topic to send messages to. This field auto-populates from your Kafka instance.
   */
  topic: string
  /**
   * The data to send to Kafka
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * Header data to send to Kafka. Format is Header key, Header value (optional).
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * The partition to send the message to (optional)
   */
  partition?: number
  /**
   * The default partition to send the message to (optional)
   */
  default_partition?: number
  /**
   * The key for the message (optional)
   */
  key?: string
  /**
   * If true, Segment will batch events before sending to Kafka.
   */
  enable_batching?: boolean
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
  /**
   * The number of bytes to batch together. Default is 1MB. Maximum value varies by kafka cluster. The less you batch, the more requests will be sent to your Kafka cluster.
   */
  batch_bytes?: number
}
