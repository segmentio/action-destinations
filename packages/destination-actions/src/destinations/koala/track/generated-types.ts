// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name
   */
  event: string
  /**
   * Properties to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  sent_at: string
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  message_id: string
}
