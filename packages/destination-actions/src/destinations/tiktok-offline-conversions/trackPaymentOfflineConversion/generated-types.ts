// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Offline Standard Events" section on in TikTok’s [Events API 2.0 documentation](https://business-api.tiktok.com/portal/docs?id=1771101186666498) for accepted event names.
   */
  event: string
  /**
   * <TODO>
   */
  event_id?: string
  /**
   * Timestamp for when the event took place. In ISO 8601 format.
   */
  timestamp?: string
  /**
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number is required if the Emails and External IDs fields are both empty.
   */
  phone_numbers?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email is required if the Phone Numbers and External IDs fields are both empty.
   */
  email_addresses?: string[]
  /**
   * Unique ID or array of IDs for a user. Segment will hash this value before sending to TikTok. At least one external Id is required if the Phone Numbers and Emails fields are both empty.
   */
  external_ids?: string[]
  /**
   * The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](<TODO>) for details.
   */
  ttclid?: string
  /**
   * If the Pixel SDK is being used and cookies are enabled, the Pixel SDK saves a unique identifier in the `_ttp` cookie and can be used to improve the match rate. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](<TODO>) (`_ttp`).
   */
  ttp?: string
  /**
   * ID of TikTok leads. This feature is in beta - please enquire with your TikTok representative for more information.
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
   * Any additional information regarding the Offline Event.
   */
  description?: string
  /**
   * The text string that was searched for.
   */
  query?: string
  /**
   * Order ID of the transaction.
   */
  order_id?: string
  /**
   * Shop ID of the transaction.
   */
  shop_id?: string
  /**
   * If set to true, flags an event for limited data processing. See [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).
   */
  limited_data_use?: boolean
  /**
   * Marks the event as a test event. The Test Event Code can be found in the TikTok Events Manager under the "Test Event" tab. Remove the code before sending Production traffic.
   */
  test_event_code?: string
  /**
   * Array of product or content items for the offline event.
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
   * Type of the product item. When the `content_id` in the `contents` parameter is specified as `sku_id`, set this field to `product`. When the `content_id` in the `contents` parameter is specified as `item_group_id`, set this field to `product_group`.
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
}
