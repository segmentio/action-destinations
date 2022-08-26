// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identify a visitor by email address when you want to update an existing contact or create a new one.
   */
  email?: string
  /**
   * a custom external ID that identifies the visitor.
   */
  id?: string
  /**
   * A list of key-value pairs, with one key-value pair per property.
   */
  custom_properties?: {
    [k: string]: unknown
  }
}
