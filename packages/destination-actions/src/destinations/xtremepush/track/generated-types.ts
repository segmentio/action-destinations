// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifiers for the user
   */
  identifers?: {
    userId?: string
    anonymousId?: string
    phone?: string
    email?: string
  }
  /**
   * The name of the Segment track() event.
   */
  event: string
  /**
   * The properties of the Segment track() event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event.
   */
  timestamp: string
  /**
   * The message ID of the event.
   */
  messageId: string
}
