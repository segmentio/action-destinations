// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  id: string
  /**
   * An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * The person's email address.
   */
  email?: string
  /**
   * A timestamp of when the person was created.
   */
  created_at?: string
  /**
   * The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).
   */
  group_id?: string
  /**
   * Optional attributes for the person. When updating a person, attributes are added or updated, not removed.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
  /**
   * The ID used to uniquely identify a custom object type in Customer.io. [Learn more](https://customer.io/docs/object-relationships).
   */
  object_type_id?: string
}
