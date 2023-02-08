// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique key of Action. LiveLike will uniquely identify any event by this key.
   */
  action_key: string
  /**
   * The name of the action being performed.
   */
  action_name?: string
  /**
   * The description of the Action.
   */
  action_description?: string
  /**
   * A unique identifier for a user. At least one of `User ID` or `LiveLike User Profile ID` is mandatory.
   */
  user_id?: string
  /**
   * The unique LiveLike user identifier. Atleast one of `LiveLike User Profile ID` or `User ID` is mandatory.
   */
  livelike_profile_id?: string
  /**
   * The timestamp of the event.
   */
  timestamp: string | number
  /**
   * Properties of the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
