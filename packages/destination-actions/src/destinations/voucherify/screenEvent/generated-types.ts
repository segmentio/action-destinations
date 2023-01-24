// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The source_id which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.
   */
  source_id: string
  /**
   * The name of the screen event that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.
   */
  event?: string
  /**
   * Additional data that will be stored in the [custom event](https://docs.voucherify.io/reference/the-custom-event-object) metadata in Voucherify.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Type of the event [The Segment Spec](https://segment.com/docs/connections/spec/).
   */
  type: string
}
