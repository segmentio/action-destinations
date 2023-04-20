// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Offline Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event: string
  /**
   * A unique value for each event. This ID can be used to match data between partner and TikTok. We suggest it is a String of 32 characters, including numeric digits (0-9), uppercase letters (A-Z), and lowercase letters (a-z).
   */
  event_id?: string
  /**
   * Timestamp that the event took place. Timestamp with ISO-8601 format.
   */
  timestamp?: string
  /**
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. At least one phone number is required if no value is provided in the Emails field.
   */
  phone_numbers?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok. At least one email is required if no value is provided in the Phone Numbers field.
   */
  email_addresses?: string[]
  /**
   * A string description of the web event.
   */
  order_id?: string
  /**
   * The text string that was searched for.
   */
  shop_id?: string
  /**
   * Event channel of the offline conversion event. Accepted values are: email, website, phone_call, in_store, crm, other
   */
  event_channel?: string
  /**
   * Related items in a web event.
   */
  contents?: {
    /**
     * Price of the product or content. Price is a required field for all content items.
     */
    price?: number
    /**
     * Number of item. Quantity is a required field for all content items.
     */
    quantity?: number
    /**
     * Type of the product item.
     */
    content_type?: string
    /**
     * Product or content identifier. Content ID is a required field for all content items.
     */
    content_id?: string
    /**
     * Name of the product item.
     */
    content_name?: string
    /**
     * Category of the product item.
     */
    content_category?: string
  }[]
  /**
   * ISO 4217 code. Required for revenue reporting. Example: "USD".List of currencies currently supported: AED, ARS, AUD, BDT, BHD, BIF, BOB, BRL, CAD, CHF, CLP, CNY, COP, CRC, CZK, DKK, DZD, EGP, EUR, GBP, GTQ, HKD, HNL, HUF, IDR, ILS, INR, ISK, JPY, KES, KHR, KRW, KWD, KZT, MAD, MOP, MXN, MYR, NGN, NIO, NOK, NZD, OMR, PEN, PHP, PHP, PKR, PLN, PYG, QAR, RON, RUB, SAR, SEK, SGD, THB, TRY, TWD, UAH, USD, VES, VND, ZAR.
   */
  currency: string
  /**
   * Revenue of total contents. Required for revenue reporting.
   */
  value: number
}
