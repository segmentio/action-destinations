// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This is the unique identifier for the customer in the your app. This is used to track the customer's journey.
   */
  externalId: string
  /**
   * The amount of the sale.
   */
  amount: number
  /**
   * The payment processor via which the sale was made.
   */
  paymentProcessor: string
  /**
   * The name of the sale event. It can be used to track different types of event for example "Purchase", "Upgrade", "Payment", etc.
   */
  eventName?: string
  /**
   * The name of the lead event that occurred before the sale (case-sensitive). This is used to associate the sale event with a particular lead event (instead of the latest lead event, which is the default behavior).
   */
  leadEventName?: string
  /**
   * The invoice ID of the sale. Can be used as a idempotency key – only one sale event can be recorded for a given invoice ID.
   */
  invoiceId?: string
  /**
   * The currency of the sale. Accepts ISO 4217 currency codes.
   */
  currency?: string
  /**
   * Additional metadata to be stored with the sale event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
