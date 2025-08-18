// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the click in Dub. You can read this value from "dub_id" cookie.
   */
  clickId: string
  /**
   * The name of the Lead event to track.
   */
  eventName: string
  /**
   * The unique identifier for the customer in the your app. Used to track the customer's journey.
   */
  externalId: string
  /**
   * The quantity of the Lead event to track.
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
   * Additional metadata to be stored with the Lead event.
   */
  metadata?: {
    [k: string]: unknown
  }
}
