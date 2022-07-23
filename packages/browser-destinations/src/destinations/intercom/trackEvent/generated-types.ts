// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * The amount associated with a purchase. Segment will multiply by 100 as Intercom requires the amount in cents.
   */
  revenue: number
  /**
   * The currency of the amount. It defaults to USD if left empty.
   */
  currency?: string
  /**
   * Optional metadata describing the event.
   */
  event_metadata: {
    [k: string]: unknown
  }
}
