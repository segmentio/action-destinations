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
   * The event name
   */
  event?: string
  /**
   * The type of the event
   */
  type: string
  /**
   * Additional event Properties or user Traits to send with the event
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
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The Segment messageId
   */
  messageId: string
}
