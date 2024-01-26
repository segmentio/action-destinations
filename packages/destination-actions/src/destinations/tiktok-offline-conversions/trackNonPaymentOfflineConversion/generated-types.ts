// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Offline Standard Events" section on in TikTok’s [Events API 2.0 documentation](https://business-api.tiktok.com/portal/docs?id=1771101186666498) for accepted event names.
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
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number value is required if both Email and External ID fields are empty.
   */
  phone_numbers?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email value is required if both Phone Number and External ID fields are empty.
   */
  email_addresses?: string[]
  /**
   * Order ID of the transaction.
   */
  order_id?: string
  /**
   * Shop ID of the transaction.
   */
  shop_id?: string
  /**
   * Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Offline Conversions Destination supports both string and string[] types for sending external ID(s). At least one external ID value is required if both Email and Phone Number fields are empty.
   */
  external_ids?: string[]
  /**
   * The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.
   */
  ttclid?: string
  /**
   * TikTok Cookie ID. If you also use Pixel SDK and have enabled cookies, Pixel SDK automatically saves a unique identifier in the `_ttp` cookie. The value of `_ttp` is used to match website visitor events with TikTok ads. You can extract the value of `_ttp` and attach the value here. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](https://ads.tiktok.com/marketing_api/docs?id=%201771100936446977) (`_ttp`).
   */
  ttp?: string
  /**
   * ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability
   */
  lead_id?: string
  /**
   * The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).
   */
  locale?: string
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
   * Related item details for the event.
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
     * Category of the product item.
     */
    content_category?: string
    /**
     * ID of the product item.
     */
    content_id?: string
    /**
     * Name of the product item.
     */
    content_name?: string
    /**
     * Brand name of the product item.
     */
    brand?: string
  }[]
  /**
   * Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.
   */
  content_type?: string
  /**
   * Currency for the value specified as ISO 4217 code.
   */
  currency?: string
  /**
   * Value of the order or items sold.
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
   * Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).
   */
  limited_data_use?: boolean
  /**
   * Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You'll want to remove your Test Event Code when sending real traffic through this integration.
   */
  test_event_code?: string
}
