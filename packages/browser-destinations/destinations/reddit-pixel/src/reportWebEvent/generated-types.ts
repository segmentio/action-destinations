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
    itemCount?: number
    /**
     * The value of the transaction in the base unit of the currency. For example, dollars, euros, pesos, rupees, and bitcoin for USD, EUR, MXN, INR, and BTC respectively. This should only be set for revenue-related events.
     */
    value?: number
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
    externalId?: string
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
    /**
     * The IDFA of an iOS device
     */
    idfa?: string
    /**
     * The AAID of an Android device
     */
    aaid?: string
    /**
     * The phone number of the user in E.164 standard format.
     */
    phoneNumber?: string
  }
  /**
   * The products associated with the conversion event.
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
   * A structure of data processing options to specify the processing type for the event. These should only be used for LDU - when the LDU flag is enabled, it may impact campaign performance and limit the size of targetable audiences.
   */
  data_processing_options?: {
    /**
     * Country Code of the user. We support ISO 3166-1 alpha-2 country code.
     */
    country?: string
    /**
     * Comma delimited list of Data Processing Modes for this conversion event. Currently only LDU (Limited Data Use) is supported.
     */
    modes?: string
    /**
     * Region Code of the user. We support ISO 3166-2 region code, ex: "US-CA, US-NY, etc." or just the region code without country prefix, e.g. "CA, NY, etc.".
     */
    region?: string
  }
}
