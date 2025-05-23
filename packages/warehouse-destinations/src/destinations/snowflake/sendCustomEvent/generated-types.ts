// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Timestamp of the event
   */
  timestamp: string
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
   * Audience or journey ID - hidden as we drop it in the warehouse pipeline, but need it for observability metrics.
   */
  computationId: string
  /**
   * Additional columns to write to Snowflake.
   */
  properties: {
    [k: string]: unknown
  }
}
