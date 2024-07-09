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
}
