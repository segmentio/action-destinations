// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The role of the contact. Accepted values are `user` or `lead`. Can only be updated if `lead`
   */
  role: string
  /**
   * A unique identifier generated outside Intercom
   */
  external_id?: string
  /**
   * The user's email
   */
  email?: string
  /**
   * The user's phone number
   */
  phone?: string
  /**
   * The user's name
   */
  name?: string
  /**
   * URL of image to be associated with user profile.
   */
  avatar?: string
  /**
   * The timestamp when the contact was created
   */
  signed_up_at?: string | number
  /**
   * The timestamp the user was last seen
   */
  last_seen_at?: string | number
  /**
   * The id of an admin that has been assigned account ownership of the contact
   */
  owner_id?: number
  /**
   * Whether the contact is unsubscribed from emails
   */
  unsubscribed_from_emails?: boolean
  /**
   * The custom attributes which are set for the contact
   */
  custom_attribute?: {
    [k: string]: unknown
  }
}
