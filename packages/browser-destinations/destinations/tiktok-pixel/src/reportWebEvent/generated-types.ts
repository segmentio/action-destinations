// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Pixel SDK documentation](https://business-api.tiktok.com/portal/docs?id=1739585696931842) for accepted event names.
   */
  event: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * A single phone number in E.164 standard format. TikTok Pixel will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string[]
  /**
   * A single email address. TikTok Pixel will be hash this value before sending to TikTok.
   */
  email?: string[]
  /**
   * The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  first_name?: string
  /**
   * The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  last_name?: string
  /**
   * The address of the customer.
   */
  address?: {
    /**
     * The customer's city.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The customer's Zip Code.
     */
    zip_code?: string
    /**
     * The customer's State.
     */
    state?: string
  }
  /**
   * Order ID of the transaction.
   */
  order_id?: string
  /**
   * Shop ID of the transaction.
   */
  shop_id?: string
  /**
   * Uniquely identifies the user who triggered the conversion event. TikTok Pixel will hash this value before sending to TikTok.
   */
  external_id?: string[]
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
}
