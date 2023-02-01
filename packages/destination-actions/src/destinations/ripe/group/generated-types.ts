// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Anonymous id
   */
  anonymousId?: string | null
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The group id
   */
  groupId: string
  /**
   * Traits to associate with the group
   */
  traits?: {
    [k: string]: unknown
  } | null
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The Segment messageId
   */
  messageId?: string
}
