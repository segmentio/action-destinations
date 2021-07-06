// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to find existing person in Pipedrive. Can be an email, name, phone number, or custom field value. Custom person fields may be included by using the long hash keys of the custom fields. These look like "33595c732cd7a027c458ea115a48a7f8a254fa86".
   */
  identifier: string
  /**
   * Name of the person
   */
  name: string
  /**
   * ID of the organization this person will belong to.
   */
  org_id?: number
  /**
   * Email addresses for this person.
   */
  email?: string[]
  /**
   * Phone number for the person.
   */
  phone?: string
  /**
   * If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string
}
