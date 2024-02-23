// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Kafka topic to send messages to.
   */
  topic: string
  /**
   * The data to send to Kafka
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * Header data to send to Kafka
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * The key for the message (optional)
   */
  key?: string
}
