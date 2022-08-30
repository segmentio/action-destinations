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
   * The name of the company the contacts is associated with.
   */
  company?: string
  /**
   * The name of the country the contacts is associated with.
   */
  country?: string
  /**
   * The name of the state the contacts is associated with.
   */
  state?: string
  /**
   * The name of the city the contacts is associated with.
   */
  city?: string
  /**
   * The street address of the contacts.
   */
  address?: string
  /**
   * The postal code of the contacts.
   */
  zip?: string
}
