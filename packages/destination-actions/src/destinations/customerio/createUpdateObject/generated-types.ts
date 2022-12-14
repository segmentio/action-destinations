// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify an object in Customer.io. [Learn more](https://customer.io/docs/object-relationships).
   */
  id: string
  /**
   * A timestamp of when the person was created.
   */
  created_at?: string
  /**
   * Optional attributes for the object. When updating an object, attributes are added or updated, not removed.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
  /**
   * The ID used to relate user to an object in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  user_id?: string
  /**
   * An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
}
