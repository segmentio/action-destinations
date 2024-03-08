// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique ID generated by the client to suppress duplicate events. The length should not exceed 128 characters.
   */
  event_id?: string
  /**
   * Timestamp that the event happened at.
   */
  timestamp: string | number
  /**
   * Type of channel, either APP or SITE
   */
  channel_type: string
  /**
   * User Identifier for the platform. The length should not exceed 128 characters.
   */
  user_id?: string
  /**
   * Device information of the event
   */
  device?: {
    /**
     * OS of the device. "ios" or "android" must be included for the APP channel type.
     */
    os?: string
    /**
     * Device OS version, which is taken from the device without manipulation or normalization. (e.g., "14.4.1")
     */
    os_version?: string
    /**
     * For app traffic, IDFA of iOS or ADID of android should be filled in this field. (e.g., 7acefbed-d1f6-4e4e-aa26-74e93dd017e4)
     */
    advertising_id?: string
    /**
     * For app traffic, a unique identifier for the device being used should be provided in this field.
     *   Clients can issue identifiers for their user devices or use their IDFV values if using iOS apps.
     *   The length of this id should not exceed 128 characters.
     */
    unique_device_id?: string
    /**
     * Device model, which is taken from the device without manipulation or normalization. (e.g., "iPhone 11 Pro")
     */
    model?: string
    /**
     * User Agent. (e.g., "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/111FFF")
     */
    ua?: string
    /**
     * ISO-639-1 alpha-2 language code. (e.g., "en")
     */
    language?: string
    /**
     * IP in IPv4 format. (e.g., 216.212.237.213)
     */
    ip?: string
  }
  /**
   * Identifier for tracking users regardless of sign-in status. The length should not exceed 128 characters.
   */
  session_id?: string
  /**
   * The default currency value. If this is set, it will be used as a default currency value for items.
   */
  default_currency?: string
  /**
   * Item information list related to the event.
   */
  items?: {
    /**
     * Unique identifier of the Item.
     */
    id: string
    /**
     * Monetary amount without currency. (e.g., 12.34 for $12.34 if currency is "USD") required if currency is provided
     */
    price?: number
    /**
     * Currency information, required if price is provided
     */
    currency?: string
    /**
     * Quantity of the item. Recommended.
     */
    quantity?: number
    /**
     * Unique identifier of the Seller.
     */
    seller_id?: string
  }[]
  /**
   * A string that can identify a context of the event,
   * such as "electronics", "categories/12312", "azd911d" or "/classes/foo/lectures/bar.
   * Any value is acceptable if it helps identifying unique pages.
   */
  page_id?: string
  /**
   * Tokens that can be used to identify a page. Alternative to page_id with a lower priority.
   */
  page_identifier_tokens?: {
    [k: string]: unknown
  }
}
