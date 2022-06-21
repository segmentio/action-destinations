// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's identity
   */
  user_id?: string
  /**
   * The Segment traits to be forwarded to Intercom
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User's name
   */
  name?: string
  /**
   * User's email
   */
  email?: string
  /**
   * A timestamp of when the person was created.
   */
  created_at?: string | number
}
