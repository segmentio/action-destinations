// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique event identifier.
   */
  event_id?: string
  /**
   * The name of your event
   */
  event_name: string
  /**
   * The name of your event
   */
  custom_event_name: string
  /**
   * The list of products purchased.
   */
  products?: {
    /**
     * The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.
     */
    price?: number
    /**
     * The quantity of the item purchased. Defaults to 1 if not specified.
     */
    quantity?: number
    /**
     * Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds.
     */
    revenue?: number
    /**
     * An identifier for the item purchased. You must send a price and quantity or revenue with this field.
     */
    productId?: string
    /**
     * The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.
     */
    revenueType?: string
  }[]
  /**
   * The IP address of the user. Use "$remote" to use the IP address on the upload request. Amplitude will use the IP address to reverse lookup a user's location (city, country, region, and DMA). Amplitude has the ability to drop the location and IP address from events once it reaches our servers. You can submit a request to Amplitude's platform specialist team here to configure this for you.
   */
  ip?: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * UTM Tracking Properties
   */
  utm_properties?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  /**
   * The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”
   */
  referrer?: string
}
