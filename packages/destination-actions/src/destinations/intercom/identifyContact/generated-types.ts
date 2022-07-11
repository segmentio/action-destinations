// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The role of the contact. Accepted values are `user` or `lead`. Can only be updated if `lead`.
   */
  role: string
  /**
   * A unique identifier generated outside Intercom. Required if role=user and email is blank.
   */
  external_id?: string
  /**
   * The contact's email. Required if role=user and external_id is blank.
   */
  email?: string
  /**
   * The contact's phone number.
   */
  phone?: string
  /**
   * The contact's name.
   */
  name?: string
  /**
   * URL of image to be associated with contact profile.
   */
  avatar?: string
  /**
   * The timestamp when the contact was created.
   */
  signed_up_at?: string | number
  /**
   * The timestamp the contact was last seen.
   */
  last_seen_at?: string | number
  /**
   * The id of an admin that has been assigned account ownership of the contact.
   */
  owner_id?: number
  /**
   * Whether the contact is unsubscribed from emails.
   */
  unsubscribed_from_emails?: boolean
  /**
   * The custom attributes which are set for the contact. Note: Will throw an error if the object has an attribute that isn`t explicitly defined on Intercom.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
