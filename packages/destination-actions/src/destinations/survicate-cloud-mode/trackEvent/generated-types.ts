// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId?: string
  /**
   * An anonymous user id
   */
  anonymousId?: string
  /**
   * The name of the event.
   */
  name: string
  /**
   * A JSON object containing additional information about the event that will be indexed by FullStory.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event. Defaults to current time if not provided.
   */
  timestamp?: string
}
