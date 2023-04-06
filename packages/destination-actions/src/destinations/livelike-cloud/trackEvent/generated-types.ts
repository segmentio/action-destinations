// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event being performed. For example, `User Registration` could be an event_name referring the event that is being sent to LiveLike.
   */
  event_name: string
  /**
   * The type of event (track/screen/page)
   */
  event_type: string
  /**
   * A unique identifier for a user.
   */
  segment_user_id?: string
  /**
   * The unique LiveLike user identifier.
   */
  livelike_profile_id?: string
  /**
   * Segment Anonymous ID.
   */
  anonymous_id?: string
  /**
   * In case you are not able to store `livelike_profile_id`, LiveLike provides a way to create your own access tokens which helps us to map your user_id to a unique `livelike_profile_id`. Please refer [LiveLike Docs](https://docs.livelike.com/docs/client-generated-access-tokens) for more info.
   */
  custom_id?: string
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
