// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A readable ID specified by you. Must have a minimum length of 5 characters. Required unless device ID is present. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event.
   */
  user_id?: string | null
  /**
   * The Global User ID to associate with the User ID.
   */
  global_user_id?: string
  /**
   * Amplitude has a default minimum id length of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.
   */
  min_id_length?: number | null
}
