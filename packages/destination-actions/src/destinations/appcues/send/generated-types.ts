// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  userId?: string
  /**
   * The anonymous user identifier
   */
  anonymousId?: string
  /**
   * The name of the event to track
   */
  event?: string
  /**
   * Properties associated with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Traits to identify the user with
   */
  user_traits?: {
    [k: string]: unknown
  }
  /**
   * The unique group identifier
   */
  groupId?: string
  /**
   * Traits associated with the group
   */
  group_traits?: {
    [k: string]: unknown
  }
  /**
   * Context object containing additional event metadata
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Integrations object to control which destinations receive this event
   */
  integrations?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The unique message identifier
   */
  messageId?: string
}
