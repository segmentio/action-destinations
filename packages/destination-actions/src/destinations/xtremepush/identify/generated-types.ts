// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of the event
   */
  type: string
  /**
   * The unique identifiers for the user
   */
  identifiers?: {
    userId?: string
    anonymousId?: string
    phone?: string
    email?: string
  }
  /**
   * Attributes assocatiated with the user.
   */
  traits?: {
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
