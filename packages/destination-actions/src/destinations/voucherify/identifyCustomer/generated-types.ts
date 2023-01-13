// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  source_id: string
  /**
   * Type of event
   */
  type: string
  /**
   * Optional attributes for the customer. When updating a customer, attributes are added or updated, not removed.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The customer's email address.
   */
  email?: string
}
