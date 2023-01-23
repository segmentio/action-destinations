// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * The unique user identifier set by you
   */
  userId?: string | null
  /**
   * The generated anonymous ID for the user
   */
  anonymousId?: string | null
  /**
   * Properties to set on the user profile
   */
  traits: {
    [k: string]: unknown
  }
}
