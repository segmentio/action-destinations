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
  event_name?: string
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
}
