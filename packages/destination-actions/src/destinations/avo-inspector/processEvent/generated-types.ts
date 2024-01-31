// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event being sent
   */
  event: string
  /**
   * Properties of the event being sent
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Context of the event being sent
   */
  context: {
    [k: string]: unknown
  }
  /**
   * Message ID of the event being sent
   */
  messageId: string
  /**
   * Timestamp of when the event was received
   */
  receivedAt: string
}
