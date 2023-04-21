// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.
   */
  time?: string | number
  /**
   * A distinct ID of an identified (logged in) user.
   */
  user_id?: string | null
  /**
   * A distinct ID of an unidentified (logged out) user. Device id is used if available
   */
  anonymous_id?: string | null
  /**
   * User's first name
   */
  first_name?: string
  /**
   * User's last name
   */
  last_name?: string
  /**
   * User's full name
   */
  name?: string
  /**
   * User's email address
   */
  email?: string
  /**
   * User's phone number
   */
  phone?: string
  /**
   * The time the user signed up to your system
   */
  created_at?: string | number
  /**
   * Properties to set on the user profile
   */
  traits?: {
    [k: string]: unknown
  }
}
