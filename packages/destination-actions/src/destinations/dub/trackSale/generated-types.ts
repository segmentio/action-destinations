// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This is the unique identifier for the customer in the your app. This is used to track the customer's journey.
   */
  externalId: string
  /**
   * The amount of the Sale.
   */
  amount: number
  /**
   * The payment processor via which the Sale was made.
   */
  paymentProcessor: string
  /**
   * The name of the Sale event. It can be used to track different types of event for example "Purchase", "Upgrade", "Payment", etc.
   */
  eventName?: string
  /**
   * The name of the Lead event that occurred before the Sale (case-sensitive). This is used to associate the Sale event with a particular Lead event (instead of the latest Lead event, which is the default behavior).
   */
  leadEventName?: string
  /**
   * The invoice ID of the Sale. Can be used as a idempotency key – only one Sale event can be recorded for a given invoice ID.
   */
  invoiceId?: string
  /**
   * The currency of the Sale. Accepts ISO 4217 currency codes.
   */
  currency?: string
  /**
   * Additional metadata to be stored with the Sale event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
