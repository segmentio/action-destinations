// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a customer group.
   */
  group_id: string
  /**
   * The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) and [create custom event](https://docs.voucherify.io/reference/create-custom-event) in Voucherify.
   */
  source_id: string
  /**
   * Custom group metadata for each customer. [Learn more](https://www.voucherify.io/glossary/metadata-custom-attributes).
   */
  traits?: {
    [k: string]: unknown
  }
}
