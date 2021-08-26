// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The User ID to be associated
   */
  user_id?: string
  /**
   * The global User ID to associate to
   */
  global_user_id?: string
  /**
   * Amplitude has a default minimum id lenght of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.
   */
  min_id_length?: number | null
}
