// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Pixel ID for your Snapchat Ad Account. Required for web and offline events.
   */
  pixel_id?: string
  /**
   * The Snap App ID associated with your app. This is a unique code generated in Snapchat Ads Manager and included in your MMP dashboard. Required for app events.
   */
  snap_app_id?: string
  /**
   * The unique ID assigned for a given application. It should be numeric for iOS, and the human interpretable string for Android. Required for app events.
   */
  app_id?: string
  /**
   * The conversion event type. Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).
   */
  event_type: string
  /**
   * Where the event took place. This must be OFFLINE, WEB, or MOBILE_APP.
   */
  event_conversion_type: string
  /**
   * Custom event label
   */
  event_tag?: string
  /**
   * The Epoch timestamp for when the conversion happened.  The timestamp cannot be more than 28 days in the past
   */
  timestamp: string
  /**
   * Email address of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.
   */
  email?: string
  /**
   * Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.
   */
  mobile_ad_id?: string
  /**
   * Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.
   */
  uuid_c1?: string
  /**
   * IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.
   */
  idfv?: string
  /**
   * Phone number of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat.
   */
  phone_number?: string
  /**
   * User agent from the user’s device.
   */
  user_agent?: string
  /**
   * IP address of the device or browser. Segment will normalize and hash this value before sending to Snapchat.
   */
  ip_address?: string
  /**
   * Category of the item.
   */
  item_category?: string
  /**
   * International Article Number (EAN) when applicable, or other product or category identifier.
   */
  item_ids?: string
  /**
   * A string description for additional info.
   */
  description?: string
  /**
   * Number of items.
   */
  number_items?: string
  /**
   * Value of the purchase.
   */
  price?: string
  /**
   * Currency for the value specified as ISO 4217 code.
   */
  currency?: string
  /**
   * Transaction ID or order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.
   */
  transaction_id?: string
  /**
   * Represents a level in the context of a game.
   */
  level?: string
  /**
   * If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same client_dedup_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.
   */
  client_dedup_id?: string
  /**
   * The text string that was searched for.
   */
  search_string?: string
  /**
   * The URL of the web page where the event took place.
   */
  page_url?: string
  /**
   * A string indicating the sign up method.
   */
  sign_up_method?: string
}
