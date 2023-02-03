// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * The unique user identifier set by you.
   */
  userId?: string | null
  /**
   * The generated anonymous ID for the user.
   */
  anonymousId?: string | null
  /**
   * Properties that you want to set on the user profile and you would want to segment by later.
   */
  traits: {
    [k: string]: unknown
  }
}
