// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the RoadwayAI batch API.
   */
  enable_batching?: boolean
  /**
   * A timestamp of when the event took place. Default is current date and time.
   */
  timestamp?: string
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * The unique user identifier set by you
   */
  user_id?: string | null
  /**
   * The generated anonymous ID for the user
   */
  anonymous_id?: string | null
  /**
   * Properties to set on the user profile
   */
  traits?: {
    [k: string]: unknown
  }
}
