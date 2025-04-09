// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the click in Dub. You can read this value from "dub_id" cookie.
   */
  clickId: string
  /**
   * The name of the lead event to track.
   */
  eventName: string
  /**
   * This is the unique identifier for the customer in the your app. This is used to track the customer's journey.
   */
  externalId: string
  /**
   * The quantity of the lead event to track.
   */
  eventQuantity?: number
  /**
   * The name of the customer.
   */
  customerName?: string
  /**
   * The email of the customer.
   */
  customerEmail?: string
  /**
   * The avatar of the customer.
   */
  customerAvatar?: string
  /**
   * Additional metadata to be stored with the lead event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
