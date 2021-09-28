// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID used to uniquely identify person in Customer.io.
   */
  id: string
  /**
   * Anonymous ID to uniquely identify person in Customer.io.
   */
  anonymous_id?: string
  /**
   * Person's email address.
   */
  email: string
  /**
   * Timestamp for when the person was created. Default is current date and time.
   */
  created_at?: string
  /**
   * Optional custom attributes for this person. When updating a person, attributes are added and not removed.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * Convert `created_at` to a Unix timestamp (seconds since Epoch).
   */
  convert_timestamp?: boolean
}
