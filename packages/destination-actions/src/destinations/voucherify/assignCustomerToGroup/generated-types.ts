// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Object containing information about the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  customer: {
    source_id: string
    email?: string
  }
  /**
   * The ID used to uniquely identify a group to which [customer](https://docs.voucherify.io/reference/the-customer-object) belongs.
   */
  group_id: string
  /**
   * Traits of the group that will be created in customer [metadata](https://www.voucherify.io/glossary/metadata-custom-attributes).
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Type of the event [The Segment Spec](https://segment.com/docs/connections/spec/).
   */
  type: string
}
