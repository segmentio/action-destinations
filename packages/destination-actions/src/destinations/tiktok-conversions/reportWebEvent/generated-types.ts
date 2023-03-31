// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format.
   */
  timestamp?: string
  /**
   * Phone number of the user who triggered the conversion event, in E.164 standard format, e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string
  /**
   * Email address of the user who triggered the conversion event. Segment will hash this value before sending to TikTok.
   */
  email?: string
  /**
   * Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok.
   */
  external_id?: string
  /**
   * The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.
   */
  ttclid?: string
  /**
   * ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability
   */
  lead_id?: string
  /**
   * The page URL where the conversion event took place.
   */
  url?: string
  /**
   * The page referrer.
   */
  referrer?: string
  /**
   * IP address of the browser.
   */
  ip?: string
  /**
   * User agent from the user’s device.
   */
  user_agent?: string
  /**
   * Related items in a web event.
   */
  contents?: {
    /**
     * Price of the item.
     */
    price?: number
    /**
     * Number of items.
     */
    quantity?: number
    /**
     * Type of the product item.
     */
    content_type?: string
    /**
     * ID of the product item.
     */
    content_id?: string
    /**
     * Category of the page/product. Example: "apparel".
     */
    content_category?: string
    /**
     * Name of the page/product. Example: "shirt".
     */
    content_name?: string
  }[]
  /**
   * Currency for the value specified as ISO 4217 code. Example: "USD".
   */
  currency?: string
  /**
   * Value of the order or items sold. Example: 100
   */
  value?: number
  /**
   * A string description of the web event.
   */
  description?: string
  /**
   * The text string that was searched for.
   */
  query?: string
  /**
   * Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You'll want to remove your Test Event Code when sending real traffic through this integration.
   */
  test_event_code?: string
}
