// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * A structure of data processing options to specify the processing type for the event. This is only used for LDU - when the LDU flag is enabled, it may impact campaign performance and limit the size of targetable audiences.
   */
  data_processing_options?: {
    /**
     * Country Code of the user. We support ISO 3166-1 alpha-2 country code.
     */
    country?: string
    /**
     * Region Code of the user. We support ISO 3166-2 region code, ex: "US-CA, US-NY, etc." or just the region code without country prefix, e.g. "CA, NY, etc.". This is only used for LDU - when the LDU flag is enabled, it may impact campaign performance and limit the size of targetable audiences.
     */
    region?: string
  }
  /**
   * A custom event name that can be passed when tracking_type is set to "Custom". All UTF-8 characters are accepted and custom_event_name must be at most 64 characters long.
   */
  custom_event_name: string
}
