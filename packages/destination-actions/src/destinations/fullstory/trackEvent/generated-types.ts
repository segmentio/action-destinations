// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's id
   */
  userId: string
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
   * The date and time when the event occurred. If not provided, the current FullStory server time will be used.
   */
  timestamp?: string | number
  /**
   * Set to true if the custom event should be attached to the user's most recent session. The most recent session must have had activity within the past 30 minutes.
   */
  useRecentSession?: boolean
  /**
   * If known, the FullStory session playback URL to which the event should be attached, as returned by the FS.getCurrentSessionURL() client API.
   */
  sessionUrl?: string
}
