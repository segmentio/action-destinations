// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The source_id which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  source_id: string
  /**
   * The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  email?: string
  /**
   * Additional [customer](https://docs.voucherify.io/reference/the-customer-object) attributes, such as email, name, description, phone, address, birthdate, metadata. When updating a customer, attributes are either added or updated in the customer object.
   */
  traits?: {
    firstName?: string
    lastName?: string
    name?: string
    description?: string
    address?: {
      [k: string]: unknown
    }
    phone?: string
    birthdate?: string
    metadata?: {
      [k: string]: unknown
    }
    [k: string]: unknown
  }
  /**
   * Type of the event [The Segment Spec](https://segment.com/docs/connections/spec/).
   */
  type: string
}
