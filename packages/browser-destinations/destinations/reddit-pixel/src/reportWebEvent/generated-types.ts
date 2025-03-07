// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * One of Reddit CAPI's standard conversion event types. To send a Custom event to Reddit use the Custom Event Action instead.
   */
  tracking_type: string
  /**
   * The unique conversion ID that corresponds to a distinct conversion event.
   */
  conversion_id?: string
  /**
   * The metadata associated with the conversion event.
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
     * The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.
     */
    value_decimal?: number
  }
  /**
   * The identifying user parameters associated with the conversion event.
   */
  user?: {
    /**
     * The mobile advertising ID for the user. This can be the iOS IDFA, Android AAID.
     */
    advertising_id?: string
    /**
     * The type of mobile device. e.g. iOS or Android.
     */
    device_type?: string
    /**
     * The email address of the user.
     */
    email?: string
    /**
     * An advertiser-assigned persistent identifier for the user.
     */
    external_id?: string
    /**
     * The IP address of the user.
     */
    ip_address?: string
    /**
     * The user agent of the user's browser.
     */
    user_agent?: string
    /**
     * The value from the first-party Pixel '_rdt_uuid' cookie on your domain. Note that it is in the '{timestamp}.{uuid}' format. You may use the full value or just the UUID portion.
     */
    uuid?: string
  }
}
