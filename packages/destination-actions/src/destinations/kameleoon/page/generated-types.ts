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
   * Page properties
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Kameleoon Visitor Code - a unique identifier for the user
   */
  kameleoonVisitorCode?: string
  /**
   * The name of the page
   */
  name?: string
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp: string
  /**
   * The Segment messageId
   */
  messageId?: string
}
