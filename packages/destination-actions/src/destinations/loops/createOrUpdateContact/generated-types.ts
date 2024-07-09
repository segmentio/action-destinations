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
   * An object containing key-value pairs of mailing list IDs and true/false determining if the contact should be added to or removed from each list.
   */
  mailingLists?: {
    [k: string]: boolean
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
