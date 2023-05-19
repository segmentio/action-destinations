// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Date the contact was created.
   */
  createdAt?: string | number
  /**
   * Attributes maintained by your team.
   */
  customAttributes?: {
    [k: string]: unknown
  }
  /**
   * Email address for the contact.
   */
  email: string
  /**
   * The contact's given name.
   */
  firstName?: string
  /**
   * The contact's surname.
   */
  lastName?: string
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
