// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The conversion event type. Please refer to the possible event types in Reddit API docs.
   */
  tracking_type: string
  /**
   * The RFC3339 timestamp when the conversion event occurred.
   */
  event_at: string
  /**
   * The Reddit-generated id associated with a single ad click.
   */
  click_id?: string | null
  /**
   * The identifying user parameters associated with the conversion event.
   */
  user_data?: {
    /**
     * The AAID of the user's device.
     */
    aaid?: string
    /**
     * A structure of data processing options to specify the processing type for the event.
     */
    data_processing_options?: {
      /**
       * Country Code of the user. We support ISO 3166-1 alpha-2 country code.
       */
      country?: string
      /**
       * Data Processing Mode for this conversion event. Currently we only support LDU (Limited Data Use).
       */
      modes?: string[]
      /**
       * Region Code of the user. We support ISO 3166-2 region code or just the region code without country prefix, e.g. CA.
       */
      region?: string
    }
    /**
     * The email address of the user.
     */
    email?: string
    /**
     * An advertiser-assigned persistent identifier for the user.
     */
    external_id?: string
    /**
     * The IDFA of the user's device.
     */
    idfa?: string
    /**
     * The IP address of the user.
     */
    ip_address?: string
    /**
     * A flag indicating whether the user has opted out of tracking.
     */
    opt_out?: boolean
    /**
     * The dimensions of the user's screen.
     */
    screen_dimensions?: {
      /**
       * The height of the user's screen in pixels. This must be positive and less than 32768.
       */
      height?: number
      /**
       * The width of the user's screen in pixels. This must be positive and less than 32768.
       */
      width?: number
    }
    /**
     * The user agent of the user's browser.
     */
    user_agent?: string
    /**
     * The value from the first-party Pixel '_rdt_uuid' cookie on your domain. Note that it is in the '{timestamp}.{uuid}' format. You may use the full value or just the UUID portion.
     */
    uuid?: string
  }
  /**
   * The metadata associated with the conversion event. Only one of "value" or "value_decimal" should be included.
   */
  event_metadata?: {
    /**
     * The metadata associated with the conversion event. Only one of "value" or "value_decimal" should be included.
     */
    event_metadata?: {
      /**
       * The currency for the value provided. This must be a three-character ISO 4217 currency code. This should only be set for revenue-related events.
       */
      currency?: string
      /**
       * The number of items in the event. This should only be set for revenue-related events.
       */
      item_count?: number
      /**
       * An array of products associated with the event.
       */
      products?: {
        /**
         * The category the product is in; for example, a label from Google's product taxonomy. Required.
         */
        category?: string
        /**
         * The ID representing the product in a catalog. Required.
         */
        id?: string
        /**
         * The name of the product. Optional.
         */
        name?: string
      }[]
      /**
       * The value of the transaction in the smallest subunit of the currency. For example, pennies, cents, centavos, paise, and satoshis for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.
       */
      value?: number
      /**
       * The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.
       */
      value_decimal?: number
    }
  }
}
