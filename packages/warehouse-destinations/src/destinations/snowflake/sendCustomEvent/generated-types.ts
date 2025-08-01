// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Additional columns to write to Snowflake.
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Name of column for the unique identifier for the message.
   */
  messageId: string
  /**
   * The type of event.
   */
  type: string
  /**
   * Time when event was received.
   */
  receivedAt: string | number
}
