// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The role of the contact. Accepted values are `user` or `lead`.
   */
  role: string
  /**
   * A unique identifier for the contact generated outside of Intercom. External ID is required if the role is `user` and email is blank. External IDs cannot be set if the role is `lead`.
   */
  external_id?: string
  /**
   * The contact's email address. Email is required if the role is `user` and External ID is blank.
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
   * An image URL containing the avatar of a contact.
   */
  avatar?: string
  /**
   * The time specified for when a contact signed up.
   */
  signed_up_at?: string | number
  /**
   * The time when the contact was last seen.
   */
  last_seen_at?: string | number
  /**
   * The ID of an admin that has been assigned account ownership of the contact.
   */
  owner_id?: number
  /**
   * The contact's email unsubscribe status.
   */
  unsubscribed_from_emails?: boolean
  /**
   * The custom attributes which are set for the contact. You can only write to custom attributes that already exist in your Intercom workspace. Please ensure custom attributes are created in Intercom first. See [Intercom documentation](https://developers.intercom.com/intercom-api-reference/reference/create-data-attributes) for more information on creating attributes.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
