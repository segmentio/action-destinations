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
  groupId?: string | null
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
   * The Segment messageId
   */
  messageId?: string
}
