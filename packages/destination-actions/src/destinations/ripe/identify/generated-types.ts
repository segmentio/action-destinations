// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string | null
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The group id
   */
  groupId?: string | null
  /**
   * Traits to associate with the user
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The Segment messageId
   */
  messageId?: string
}
