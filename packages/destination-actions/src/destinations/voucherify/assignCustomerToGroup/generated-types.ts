// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Object containing information about the [customer](https://docs.voucherify.io/reference/the-customer-object).
   */
  customer: {
    /**
     * The `source_id` which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
     */
    source_id: string
    /**
     * The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
     */
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
   * Type of the [event](https://segment.com/docs/connections/spec/). For example: identify, track, page, screen or group.
   */
  type: string
}
