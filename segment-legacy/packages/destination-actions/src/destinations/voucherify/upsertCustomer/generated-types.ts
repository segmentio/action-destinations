// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The `source_id` which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  source_id: string
  /**
   * First name and last name of the [customer](https://docs.voucherify.io/reference/customer-object).
   */
  name?: string | null
  /**
   * First name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `last_name` to create the `name` field.
   */
  first_name?: string | null
  /**
   * Last name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `first_name` to create the `name` field.
   */
  last_name?: string | null
  /**
   * An arbitrary string that you can attach to a [customer](https://docs.voucherify.io/reference/customer-object) object.
   */
  description?: string | null
  /**
   * The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  email?: string | null
  /**
   * Phone number of the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  phone?: string | null
  /**
   * Birthdate of the [customer](https://docs.voucherify.io/reference/the-customer-object). You can pass data here in `date` or `datetime` format (ISO 8601).
   */
  birthdate?: string | null
  /**
   * Address of the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  address?: {
    city?: string | null
    state?: string | null
    postal_code?: string | null
    street?: string | null
    country?: string | null
  }
  /**
   * A set of custom key/value pairs that you can attach to a customer. The metadata object stores all custom attributes assigned to the customer. It can be useful for storing additional information about the customer in a structured format.
   */
  metadata?: {
    [k: string]: unknown
  } | null
  /**
   * Type of the [event](https://segment.com/docs/connections/spec/). For example: identify, track, page, screen or group
   */
  type: string
}
