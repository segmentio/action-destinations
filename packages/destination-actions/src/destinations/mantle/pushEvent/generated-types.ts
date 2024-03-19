// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event you want to push to Mantle
   */
  eventName: string
  /**
   * The unique identifier for the event. This is used to deduplicate events in Mantle
   */
  eventId?: string
  /**
   * The unique identifier for the customer. This is used to associate the event with a customer in Mantle. It can be the internal customer ID, API token, Shopify shop ID, or Shopify shop domain
   */
  customerId: string
  /**
   * The properties of the event. This is the extra data you want to attach to the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event, defaults to the current time
   */
  timestamp?: string | number
}
