// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Columns to write to Snowflake.
   */
  columns: {
    /**
     * Timestamp of the event
     */
    timestamp?: string
    /**
     * Name of column for the unique identifier for the message.
     */
    messageId?: string
    /**
     * Audience ID
     */
    computationId?: string
    [k: string]: unknown
  }
}
