// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier for the event message.
   */
  messageId: string
  /**
   * The timestamp of the event. If not provided, the current time will be used.
   */
  timestamp: string
  /**
   * The type of event to send to Attribution.
   */
  type: string
  /**
   * The name of the event to send to Attribution. Required for track events.
   */
  event?: string
  /**
   * The name of the page or screen.
   */
  name?: string
  /**
   * The properties of the event to send to Attribution.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The traits of the user to send to Attribution.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The ID of the user to send to Attribution.
   */
  userId?: string
  /**
   * The anonymous ID of the user to send to Attribution.
   */
  anonymousId?: string
  /**
   * The ID of the group to send to Attribution.
   */
  groupId?: string
  /**
   * The context of the event to send to Attribution.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The previous ID of the user to send to Attribution.
   */
  previousId?: string
}
