// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The anonymous id
   */
  anonymousId: string
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The ID associated groupId
   */
  groupId: string | null
  /**
   * Traits to associate with the group
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  messageId?: string
}
