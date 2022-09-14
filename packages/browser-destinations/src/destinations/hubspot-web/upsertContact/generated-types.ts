// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identify a contacts by email address when you want to update an existing contact or create a new one.
   */
  email: string
  /**
   * A custom external ID that identifies the visitor.
   */
  id?: string
  /**
   * A list of key-value pairs, with one key-value pair per property.
   */
  custom_properties?: {
    [k: string]: unknown
  }
  /**
   * The name of the company the contact is associated with.
   */
  company?: string
  /**
   * The name of the country the contact is associated with.
   */
  country?: string
  /**
   * The name of the state the contact is associated with.
   */
  state?: string
  /**
   * The name of the city the contact is associated with.
   */
  city?: string
  /**
   * The street address of the contact.
   */
  address?: string
  /**
   * The postal code of the contact.
   */
  zip?: string
}
