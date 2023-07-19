// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Pixel documentation](https://ads.tiktok.com/marketing_api/docs?id=1739585696931842) for accepted event names.
   */
  event: string
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
  }[]
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
