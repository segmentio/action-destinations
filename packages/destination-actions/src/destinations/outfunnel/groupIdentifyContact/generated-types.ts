// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Type of the event
   */
  type: string
  /**
   * The identifier of the user
   */
  user_id: string
  /**
   * Anonymous ID of the user
   */
  anonymous_id?: string
  /**
   * Email address of the user who performed the event
   */
  email?: string
  /**
   * The time the event occured as UTC unix timestamp
   */
  timestamp: string | number
  /**
   * Group traits
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * Event context
   */
  context: {
    [k: string]: unknown
  }
}
