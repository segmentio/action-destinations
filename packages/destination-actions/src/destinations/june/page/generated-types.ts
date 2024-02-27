// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * Page properties
   */
  properties?: {
    [k: string]: unknown
  }
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
