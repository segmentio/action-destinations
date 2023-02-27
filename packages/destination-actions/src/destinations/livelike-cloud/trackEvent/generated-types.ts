// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique key of Action. LiveLike will uniquely identify any event by this key. For example, `user-registration` could be a key for the action `USER REGISTRATION`.
   */
  action_key: string
  /**
   * The name of the action being performed. For example, `User Registration` could be an action_name referring the event that is being sent to LiveLike.
   */
  action_name?: string
  /**
   * The description of the Action.
   */
  action_description?: string
  /**
   * A unique identifier for a user. At least one of `User ID` or `LiveLike User Profile ID` is mandatory. In case you are not able to store `livelike_profile_id`, LiveLike provides a way to create your own access tokens which helps us to map your user_id to a unique `livelike_profile_id`. Please refer [LiveLike Docs](https://docs.livelike.com/docs/client-generated-access-tokens) for more info.
   */
  user_id?: string
  /**
   * The unique LiveLike user identifier. At least one of `LiveLike User Profile ID` or `User ID` is mandatory.
   */
  livelike_profile_id?: string
  /**
   * The date and time when the event occurred in ISO 8601 format. Defaults to current time if not provided. For example, `2019-09-30T15:59:44.933696Z`.
   */
  timestamp: string
  /**
   * Properties of the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
