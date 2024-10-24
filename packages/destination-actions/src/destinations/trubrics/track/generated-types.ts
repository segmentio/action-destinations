// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name
   */
  event: string
  /**
   * Properties to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * user properties to send with the event
   */
  traits?: {
    [k: string]: unknown
  }
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
   * The ID associated with the user
   */
  user_id?: string
  /**
   * The Anonymous ID associated with the user
   */
  anonymous_id?: string
}
