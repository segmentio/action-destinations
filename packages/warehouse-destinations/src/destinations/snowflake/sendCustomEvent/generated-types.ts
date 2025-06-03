// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of column for the unique identifier for the message.
   */
  messageId: string
  /**
   * Name of the table. This will be the event name.
   */
  event: string
  /**
   * The type of event
   */
  type: string
  /**
   * Additional columns to write to Snowflake.
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Timestamp of the event
   */
  timestamp: string | number
  /**
   * Time on the client device when call was invoked.
   */
  originalTimestamp: string | number
  /**
   * Time on client device when call was sent.
   */
  sentAt?: string | number
  /**
   * Time on Segment server clock when call was received.
   */
  receivedAt?: string | number
}
