// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * Object of properties and the values to increment or decrement. For example: `{"purchases": 1, "items": 6}}.
   */
  increment: {
    [k: string]: unknown
  }
}
