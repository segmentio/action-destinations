// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The track() event name or page() name for the event.
   */
  name: string
  /**
   * A JSON object containing additional information about the event that will be indexed by replaybird.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * A unique ID for a known user
   */
  userId?: string
  /**
   * A unique ID for a anonymous user
   */
  anonymousId?: string
}
