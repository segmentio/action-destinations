// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The conversion event type. For custom events, you must use one of the predefined event types (i.e. CUSTOM_EVENT_1). Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).
   */
  event_type: string
  /**
   * Where the event took place. This must be OFFLINE, WEB, or MOBILE_APP.
   */
  event_conversion_type: string
  /**
   * Custom event label.
   */
  event_tag?: string
  /**
   * The Epoch timestamp for when the conversion happened.  The timestamp cannot be more than 28 days in the past.
   */
  timestamp: string
  /**
   * Email address of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  email?: string
  /**
   * Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
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
   * Phone number of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  phone_number?: string
  /**
   * User agent from the user’s device. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  user_agent?: string
  /**
   * IP address of the device or browser. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
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
   * Value of the purchase.This should be a single number.
   */
  price?: number
  /**
   * Currency for the value specified as ISO 4217 code.
   */
  currency?: string
  /**
   * Transaction ID or order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Ads Kit events.
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
  /**
   * The user’s OS version.
   */
  os_version?: string
  /**
   * The user’s device model.
   */
  device_model?: string
  /**
   * The ID value stored in the landing page URL's `&ScCid=` query parameter. Using this ID improves ad measurement performance. We also encourage advertisers who are using `click_id` to pass the full url in the `page_url` field. For more details, please refer to [Sending a Click ID](#sending-a-click-id)
   */
  click_id?: string
  /**
   * First name of the converted user.
   */
  first_name?: string
  /**
   * Middle name of the converted user.
   */
  middle_name?: string
  /**
   * Last name of the converted user.
   */
  last_name?: string
}
