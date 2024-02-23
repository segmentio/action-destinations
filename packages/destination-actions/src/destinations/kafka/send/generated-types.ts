// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The key for the message (optional)
   */
  messageKey?: string
  /**
   * The data to send to Kafka
   */
  payload: {
    [k: string]: unknown
  }
  /**
   * The Kafka topic to send messages to.
   */
  topic: string
}
