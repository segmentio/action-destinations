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
  timestamp: string
  /**
   * The anonymous ID associated with the user
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  messageId: string
}
