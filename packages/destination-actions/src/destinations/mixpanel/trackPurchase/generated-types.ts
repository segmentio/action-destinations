// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, send "Product Purchased" with each product within the event.
   */
  generatePurchaseEventPerProduct?: boolean
  /**
   * A distinct ID specified by you.
   */
  distinct_id?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  group_id?: string
  /**
   * A random id that is unique to an event. Mixpanel uses $insert_id to deduplicate events.
   */
  insert_id?: string
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
   * Products in the order
   */
  products?: {
    /**
     * Database id of the product being viewed
     */
    product_id?: string
    /**
     * Sku of the product being viewed
     */
    sku?: string
    /**
     * Product category being viewed
     */
    category?: string
    /**
     * Name of the product being viewed
     */
    name?: string
    /**
     * Brand associated with the product
     */
    brand?: string
    /**
     * Variant of the product
     */
    variant?: string
    /**
     * Price ($) of the product being viewed
     */
    price?: number
    /**
     * Quantity of a product
     */
    quantity?: number
    /**
     * Coupon code associated with a product (for example, MAY_DEALS_3)
     */
    coupon?: string
    /**
     * Position in the product list (ex. 3)
     */
    position?: number
    /**
     * URL of the product page
     */
    url?: string
    /**
     * Image url of the product
     */
    image_url?: string
    [k: string]: unknown
  }[]
  /**
   * The name of the action being performed.
   */
  event: string
}
