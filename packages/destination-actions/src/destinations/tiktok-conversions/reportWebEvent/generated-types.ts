// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on this [page](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event?: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format.
   */
  timestamp?: string
  /**
   * The Segment event type, e.g. "page".
   */
  type?: string
  /**
   * Additional properties such as content info, description, and currency.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Phone number of the user who triggered the conversion event, in E.164 standard format, e.g. +14150000000.
   */
  phone_number?: string
  /**
   * Email address of the user who triggered the conversion event.
   */
  email?: string
  /**
   * Uniquely identifies the user who triggered the conversion event.
   */
  external_id: string
  /**
   * The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.
   */
  ttclid?: string
}
