// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the SingleStore database to send data to.
   */
  database: string
  /**
   * The type of the event.
   */
  type: string
  /**
   * The name of the event.
   */
  event: string
  /**
   * The timestamp of the event.
   */
  timestamp: string
  /**
   * The message ID of the event.
   */
  messageId: string
  /**
   * The complete event payload.
   */
  message: string
}
