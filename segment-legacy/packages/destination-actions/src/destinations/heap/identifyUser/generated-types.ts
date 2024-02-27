// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * REQUIRED: A string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify
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
