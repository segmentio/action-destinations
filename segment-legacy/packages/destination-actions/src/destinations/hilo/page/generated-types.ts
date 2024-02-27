// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string
  /**
   * Page name
   */
  name?: string
  /**
   * Properties to associate with the page view
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the page view
   */
  timestamp: string
  /**
   * The ID associated with the user
   */
  userId?: string
}
