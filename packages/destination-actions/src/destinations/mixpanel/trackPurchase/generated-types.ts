// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A distinct ID specified by you.
   */
  distinct_id?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  group_id?: string
  /**
   * The timestamp of the event. If time is not sent with the event, it will be set to the time our servers receive it.
   */
  time?: string | number
  /**
   * The name of your application
   */
  app_name?: string
  /**
   * The namespace of your application.
   */
  app_namespace?: string
  /**
   * The current build of your application.
   */
  app_build?: string
  /**
   * The current version of your application.
   */
  app_version?: string
  /**
   * The name of the mobile operating system or browser that the user is using.
   */
  os_name?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  os_version?: string
  /**
   * A unique identifier for the device the user is using.
   */
  device_id?: string
  /**
   * The type of the user's device
   */
  device_type?: string
  /**
   * The name of the user's device
   */
  device_name?: string
  /**
   * The device manufacturer that the user is using.
   */
  device_manufacturer?: string
  /**
   * The device model that the user is using.
   */
  device_model?: string
  /**
   * Whether bluetooth is enabled
   */
  bluetooth?: boolean
  /**
   * The carrier that the user is using.
   */
  carrier?: string
  /**
   * Whether cellular is enabled
   */
  cellular?: boolean
  /**
   * Set to true if user’s device has an active, available Wifi connection, false if not.
   */
  wifi?: boolean
  /**
   * The current country of the user.
   */
  country?: string
  /**
   * The current region of the user.
   */
  region?: string
  /**
   * The language set by the user.
   */
  language?: string
  /**
   * The name of the SDK used to send events
   */
  library_name?: string
  /**
   * The version of the SDK used to send events
   */
  library_version?: string
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * Identifier for Advertiser. _(iOS)_
   */
  idfa?: string
  /**
   * The full URL of the webpage on which the event is triggered.
   */
  url?: string
  /**
   * Width, in pixels, of the device screen.
   */
  screen_width?: number
  /**
   * Height, in pixels, of the device screen.
   */
  screen_height?: number
  /**
   * Pixel density of the device screen.
   */
  screen_density?: number
  /**
   * Referrer url
   */
  referrer?: string
  /**
   * User agent
   */
  userAgent?: string
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that represent additional data tied to the user.
   */
  user_properties?: {
    [k: string]: unknown
  }
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
   * Set as true to ensure Segment sends data to Mixpanel in batches.
   */
  enable_batching?: boolean
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
    [k: string]: unknown
  }[]
  /**
   * The name of the action being performed.
   */
  event: string
}
