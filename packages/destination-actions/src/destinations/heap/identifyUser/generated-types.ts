// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An identity, typically corresponding to an existing user. If no such identity exists, then a new user will be created with that identity. Case-sensitive string, limited to 255 characters.
   */
  user_id?: string | null
  /**
   * The generated anonymous ID for the user.
   */
  anonymous_id?: string | null
  /**
   * An object with key-value properties you want associated with the user. Each key and property must either be a number or string with fewer than 1024 characters.
   */
  traits?: {
    [k: string]: unknown
  }
}
