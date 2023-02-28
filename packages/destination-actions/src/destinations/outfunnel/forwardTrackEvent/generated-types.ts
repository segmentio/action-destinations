// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Indicates which action was triggered
   */
  action: string
  /**
   * The name of the event that occured
   */
  event_name: string
  /**
   * The identifier of the user who performed the event
   */
  user_id?: string
  /**
   * Anonymous ID of the user
   */
  anonymous_id?: string
  /**
   * The identifier of the group where user belongs to
   */
  group_id?: string
  /**
   * Email address of the user who performed the event
   */
  email: string
  /**
   * The time the event occured in UTC
   */
  timestamp: string
  /**
   * Optional metadata describing the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Event context
   */
  context?: {
    [k: string]: unknown
  }
}
