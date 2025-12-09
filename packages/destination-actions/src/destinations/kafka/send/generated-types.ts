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
   * Specifies the maximum number of bytes to batch before sending. The default is 1 MB, though the maximum allowed depends on the Kafka cluster. Smaller batch sizes result in more frequent requests to the cluster.
   */
  batch_bytes?: number
}
