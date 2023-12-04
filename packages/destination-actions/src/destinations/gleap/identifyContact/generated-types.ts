// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for the contact.
   */
  userId: string
  /**
   * The contact's first name.
   */
  firstName?: string
  /**
   * The contact's last name.
   */
  lastName?: string
  /**
   * The contact's email address.
   */
  email?: string
  /**
   * The contact's phone number.
   */
  phone?: string
  /**
   * The contact's company name.
   */
  companyName?: string
  /**
   * The contact's compan ID
   */
  companyId?: string
  /**
   * The user's language.
   */
  lang?: string
  /**
   * The user's subscription plan.
   */
  plan?: string
  /**
   * The user's value.
   */
  value?: number
  /**
   * The page where the contact was last seen.
   */
  lastPageView?: string
  /**
   * The time specified for when a contact signed up.
   */
  createdAt?: string | number
  /**
   * The time when the contact was last seen.
   */
  lastActivity?: string | number
  /**
   * The custom attributes which are set for the contact.
   */
  customAttributes?: {
    [k: string]: unknown
  }
}
