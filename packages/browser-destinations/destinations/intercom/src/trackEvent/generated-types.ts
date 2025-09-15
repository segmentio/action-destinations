// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * The amount associated with a purchase. Segment will multiply by 100 as Intercom requires the amount in cents.
   */
  revenue?: number
  /**
   * The currency of the purchase amount. Segment will default to USD if revenue is provided without a currency.
   */
  currency?: string
  /**
   * Optional metadata describing the event.
   */
  event_metadata?: {
    [k: string]: unknown
  }
}
