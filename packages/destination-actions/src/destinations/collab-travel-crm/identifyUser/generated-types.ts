// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the contact.
   */
  email: string
  /**
   * The first name of the contact.
   */
  firstName?: string
  /**
   * The last name of the contact.
   */
  lastName?: string
  /**
   * The phone number of the contact.
   */
  phone?: string
  /**
   * The unique identifier for the user.
   */
  userId?: string
  /**
   * Additional user traits to sync.
   */
  traits?: {
    [k: string]: unknown
  }
}
