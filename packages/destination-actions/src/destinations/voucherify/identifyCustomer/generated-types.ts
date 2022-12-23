// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) and [create custom event](https://docs.voucherify.io/reference/create-custom-event) in Voucherify.
   */
  source_id: string
  /**
   * Optional attributes for the person. When updating a person, attributes are added or updated, not removed.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The person's email address.
   */
  email?: string
}
