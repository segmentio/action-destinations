// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The `source_id` which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  source_id: string
  /**
   * First name and last name of the [customer](https://docs.voucherify.io/reference/customer-object).
   */
  name?: string
  /**
   * First name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `last_name` to create the `name` field.
   */
  first_name?: string
  /**
   * Last name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `first_name` to create the `name` field.
   */
  last_name?: string
  /**
   * An arbitrary string that you can attach to a [customer](https://docs.voucherify.io/reference/customer-object) object.
   */
  description?: string
  /**
   * The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  email?: string
  /**
   * Phone number of the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  phone?: string
  /**
   * Birthdate of the [customer](https://docs.voucherify.io/reference/the-customer-object). You can pass data here in `date` or `datetime` format (ISO 8601).
   */
  birthdate?: string
  /**
   * Address of the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  address?: {
    city?: string
    state?: string
    postal_code?: string
    street?: string
    country?: string
  }
  /**
   * A set of custom key/value pairs that you can attach to a customer. The metadata object stores all custom attributes assigned to the customer. It can be useful for storing additional information about the customer in a structured format.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Type of the [event](https://segment.com/docs/connections/spec/). For example: identify, track, page, screen or group
   */
  type: string
}
