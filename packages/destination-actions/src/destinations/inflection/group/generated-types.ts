// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the user.
   */
  userId: string
  /**
   * The Segment anonymous ID of the user.
   */
  anonymousId?: string
  /**
   * The unique ID of the Segment event.
   */
  messageId: string
  /**
   * The timestamp of the event.
   */
  timestamp: string | number
  /**
   * The unique identifier of the group.
   */
  groupId: string
  /**
   * Traits of the group. Nested objects and arrays are sent as JSON strings.
   */
  traits?: {
    [k: string]: unknown
  }
}
