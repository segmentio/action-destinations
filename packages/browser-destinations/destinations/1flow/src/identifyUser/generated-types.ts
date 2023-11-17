// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for the user.
   */
  userId?: string
  /**
   * An anonymous identifier for the user.
   */
  anonymousId?: string
  /**
   * The user's custom attributes.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The user's first name.
   */
  first_name?: string
  /**
   * The user's last name.
   */
  last_name?: string
  /**
   * The user's phone number.
   */
  phone?: string
  /**
   * The user's email address.
   */
  email?: string
}
