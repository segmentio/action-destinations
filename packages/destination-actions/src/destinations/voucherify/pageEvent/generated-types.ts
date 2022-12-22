// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique ID that identifies customer in Voucherify.
   */
  source_id: string
  /**
   * The name of the event.
   */
  event: string
  /**
   * When the event took place.
   */
  created_at?: string
  /**
   * Optional data to include with the event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
