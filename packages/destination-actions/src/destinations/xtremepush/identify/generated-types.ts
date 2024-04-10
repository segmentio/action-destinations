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
