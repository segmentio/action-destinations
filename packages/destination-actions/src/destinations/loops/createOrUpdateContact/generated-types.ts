// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Date the contact was created.
   */
  createdAt?: string | number
  /**
   * Contact attributes maintained by your team.
   */
  customAttributes?: {
    [k: string]: unknown
  }
  /**
   * Email address for the contact. This is required when creating new contacts.
   */
  email?: string
  /**
   * The contact's given name.
   */
  firstName?: string
  /**
   * The contact's surname.
   */
  lastName?: string
  /**
   * Key-value pairs of mailing list IDs and a boolean denoting if the contact should be added (true) or removed (false) from the list. Input list IDs as keys on the right, and a boolean true or false value on the left.
   */
  mailingLists?: {
    [k: string]: unknown
  }
  /**
   * The contact's source.
   */
  source?: string
  /**
   * Whether the contact is subscribed to email.
   */
  subscribed?: boolean
  /**
   * The contact's user group.
   */
  userGroup?: string
  /**
   * User ID for the contact.
   */
  userId: string
}
