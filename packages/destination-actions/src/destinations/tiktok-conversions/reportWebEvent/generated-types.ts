// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to TikTok "Web Event" section on this [page](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event?: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place. Timestamp with ISO 8601 format.
   */
  timestamp?: string
  /**
   * The segment event type. Ex. "page".
   */
  type?: string
  /**
   * Additional properties such as content info, description, and currency.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Phone number of the purchaser, in E.164 standard format, e.g. +14150000000
   */
  phone_number?: string
  /**
   * Email address of the customer who triggered the conversion event.
   */
  email: string
  /**
   * Uniquely identifies a user using Segment ID.
   */
  external_id: string
}
