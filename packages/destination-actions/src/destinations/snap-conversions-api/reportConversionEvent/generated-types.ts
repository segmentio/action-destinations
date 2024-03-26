// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * These fields support sending app events to Snapchat through the Conversions API.
   */
  app_data?: {
    /**
     * *Required for app events*
     *               Use this field to specify ATT permission on an iOS 14.5+ device. Set to 0 for disabled or 1 for enabled.
     */
    advertiser_tracking_enabled?: boolean
    /**
     * *Required for app events*
     *               A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use 0 for disabled, 1 for enabled.
     */
    application_tracking_enabled?: boolean
    /**
     * *Required for app events* Example: 'i2'.
     */
    version?: string
    /**
     * Example: 'com.snapchat.sdk.samples.hello'.
     */
    packageName?: string
    /**
     * Example: '1.0'.
     */
    shortVersion?: string
    /**
     * Example: '1.0 long'.
     */
    longVersion?: string
    /**
     * Example: '13.4.1'.
     */
    osVersion?: string
    /**
     * Example: 'iPhone5,1'.
     */
    deviceName?: string
    /**
     * Example: 'En_US'.
     */
    locale?: string
    /**
     * Example: 'PST'.
     */
    timezone?: string
    /**
     * Example: 'AT&T'.
     */
    carrier?: string
    /**
     * Example: '1080'.
     */
    width?: string
    /**
     * Example: '1920'.
     */
    height?: string
    /**
     * Example: '2.0'.
     */
    density?: string
    /**
     * Example: '8'.
     */
    cpuCores?: string
    /**
     * Example: '64'.
     */
    storageSize?: string
    /**
     * Example: '32'.
     */
    freeStorage?: string
    /**
     * Example: 'USA/New York'.
     */
    deviceTimezone?: string
  }
  /**
   * If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same event_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.
   */
  event_id?: string
  /**
   * These parameters are a set of identifiers Snapchat can use for targeted attribution. You must provide at least one of the following parameters in your request.
   */
  user_data?: {
    /**
     * Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.
     */
    externalId?: string[]
    /**
     * An email address in lowercase.
     */
    email?: string
    /**
     * A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code, even if all of the data is from the same country, as the country code is used for matching.
     */
    phone?: string
    /**
     * Gender in lowercase. Either f or m.
     */
    gender?: string
    /**
     * A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.
     */
    dateOfBirth?: string
    /**
     * A last name in lowercase.
     */
    lastName?: string
    /**
     * A first name in lowercase.
     */
    firstName?: string
    /**
     * A city in lowercase without spaces or punctuation. Example: menlopark.
     */
    city?: string
    /**
     * A two-letter state code in lowercase. Example: ca.
     */
    state?: string
    /**
     * A five-digit zip code for United States. For other locations, follow each country`s standards.
     */
    zip?: string
    /**
     * A two-letter country code in lowercase.
     */
    country?: string
    /**
     * The IP address of the browser corresponding to the event.
     */
    client_ip_address?: string
    /**
     * The user agent for the browser corresponding to the event. This is required if action source is “website”.
     */
    client_user_agent?: string
    /**
     * The subscription ID for the user in this transaction.
     */
    subscriptionID?: string
    /**
     * This is the identifier associated with your Snapchat Lead Ad.
     */
    leadID?: number
    /**
     * Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
     */
    madid?: string
    /**
     * The ID value stored in the landing page URL's `&ScCid=` query parameter. Using this ID improves ad measurement performance. We also encourage advertisers who are using `click_id` to pass the full url in the `page_url` field. For more details, please refer to [Sending a Click ID](#sending-a-click-id)
     */
    sc_click_id?: string
    /**
     * Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.
     */
    sc_cookie1?: string
    /**
     * IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.
     */
    idfv?: string
  }
  /**
   * The Data Processing Options to send to Snapchat. If set to true, Segment will send an array to Snapchat indicating events should be processed with Limited Data Use (LDU) restrictions.
   */
  data_processing_options?: boolean
  /**
   * A country that you want to associate to the Data Processing Options. Accepted values are 1, for the United States of America, or 0, to request that Snapchat geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.
   */
  data_processing_options_country?: number
  /**
   * A state that you want to associate to the Data Processing Options. Accepted values are 1000, for California, or 0, to request that Snapchat geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.
   */
  data_processing_options_state?: number
  /**
   * Use this field to send details of mulitple products / items. This field overrides individual 'Item ID', 'Item Category' and 'Brand' fields. Note: total purchase value is tracked using the 'Price' field
   */
  products?: {
    /**
     * Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.
     */
    item_id?: string
    /**
     * Category of the item. This field accepts a string.
     */
    item_category?: string
    /**
     * Brand associated with the item. This field accepts a string.
     */
    brand?: string
  }[]
  /**
   * The conversion event type. For custom events, you must use one of the predefined event types (i.e. CUSTOM_EVENT_1). Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).
   */
  event_type: string
  /**
   * Where the event took place. This must be OFFLINE, WEB, or MOBILE_APP.
   */
  event_conversion_type: string
  /**
   * The Epoch timestamp for when the conversion happened. The timestamp cannot be more than 28 days in the past.
   */
  timestamp: string
  /**
   * Total value of the purchase. This should be a single number. Can be overriden using the 'Track Purchase Value Per Product' field.
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
   * Brand associated with the item. This field accepts a string or a list of strings
   */
  brands?: string[]
  /**
   * The ID value stored in the landing page URL's `&ScCid=` query parameter. Using this ID improves ad measurement performance. We also encourage advertisers who are using `click_id` to pass the full url in the `page_url` field. For more details, please refer to [Sending a Click ID](#sending-a-click-id)
   */
  click_id?: string
  /**
   * If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same client_dedup_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.
   */
  client_dedup_id?: string
  /**
   * A string description for additional info.
   */
  description?: string
  /**
   * The user’s device model.
   */
  device_model?: string
  /**
   * Email address of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  email?: string
  /**
   * Custom event label.
   */
  event_tag?: string
  /**
   * IDFV of the user’s device. Segment will normalize and hash this value before sending to Snapchat.
   */
  idfv?: string
  /**
   * IP address of the device or browser. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  ip_address?: string
  /**
   * Category of the item. This field accepts a string.
   */
  item_category?: string
  /**
   * Identfier for the item. International Article Number (EAN) when applicable, or other product or category identifier.
   */
  item_ids?: string
  /**
   * Represents a level in the context of a game.
   */
  level?: string
  /**
   * Mobile ad identifier (IDFA or AAID) of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  mobile_ad_id?: string
  /**
   * Number of items. This field accepts a string only. e.g. "5"
   */
  number_items?: string
  /**
   * The user’s OS version.
   */
  os_version?: string
  /**
   * Phone number of the user who triggered the conversion event. Segment will normalize and hash this value before sending to Snapchat. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  phone_number?: string
  /**
   * User agent from the user’s device. [Snapchat requires](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters) that every payload contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields. Also see [Segment documentation](https://segment.com/docs/connections/destinations/catalog/actions-snap-conversions/#required-parameters-and-hashing).
   */
  user_agent?: string
  /**
   * Unique user ID cookie. If you are using the Pixel SDK, you can access a cookie1 by looking at the _scid value.
   */
  uuid_c1?: string
}
