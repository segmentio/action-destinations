// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) and [create custom event](https://docs.voucherify.io/reference/create-custom-event) in Voucherify.
   */
  source_id: string
  /**
   * The name of the [custom event](https://docs.voucherify.io/reference/the-custom-event-object).
   */
  name: string
  /**
   * Timestamp when the event was created.
   */
  created_at?: string
  /**
   * Optional data to include with the event.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Type of event
   */
  type?: string
}
