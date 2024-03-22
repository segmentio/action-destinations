// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the user in your database. A userId or an anonymousId is required.
   */
  user_id?: string
  /**
   * A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.
   */
  anonymous_id?: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string | number
  /**
   * Name of the action that a user has performed.
   */
  event_name: string
  /**
   * The group or account ID a user is associated with.
   */
  group_id?: string
  /**
   * Free-form dictionary of properties that describe the screen.
   */
  properties?: {
    [k: string]: unknown
  }
}
