// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Anonymous id
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The type of the event
   */
  type: string
  /**
   * The group id
   */
  groupId: string
  /**
   * Traits to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Kameleoon Visitor Code - a unique identifier for the user
   */
  kameleoonVisitorCode?: string
  /**
   * The timestamp of the event
   */
  timestamp: string
  /**
   * The Segment messageId
   */
  messageId: string
}
