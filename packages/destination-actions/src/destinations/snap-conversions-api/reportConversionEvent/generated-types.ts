// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The conversion event type. For custom events, you must use one of the predefined event types (i.e. CUSTOM_EVENT_1). Please refer to the possible event types in [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#conversion-parameters).
   */
  event_name?: string
  /**
   * If you are reporting events via more than one method (Snap Pixel, App Ads Kit, Conversions API) you should use the same event_id across all methods. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Adds Kit events.
   */
  event_id?: string
  /**
   * The Epoch timestamp for when the conversion happened. The timestamp cannot be more than 7 days in the past.
   */
  event_time?: string
  /**
   * This field allows you to specify where your conversions occurred.
   */
  action_source?: string
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
   * The custom data object can be used to pass custom properties.
   */
  custom_data?: {
    /**
     * Currency for the value specified as ISO 4217 code.
     */
    currency?: string
    /**
     * The number of items when checkout was initiated.
     */
    num_items?: number
    /**
     * Order ID tied to the conversion event. Please refer to the [Snapchat Marketing API docs](https://marketingapi.snapchat.com/docs/conversion.html#deduplication) for information on how this field is used for deduplication against Snap Pixel SDK and App Ads Kit events.
     */
    order_id?: string
    /**
     * The text string that was searched for.
     */
    search_string?: string
    /**
     * A string indicating the sign up method.
     */
    sign_up_method?: string
    /**
     * Total value of the purchase. This should be a single number. Can be overriden using the 'Track Purchase Value Per Product' field.
     */
    value?: number
    /**
     * The desired hotel check-in date in the hotel's time-zone. Accepted formats are YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD and YYYY-MM-DDThh:mm:ssTZD
     */
    checkin_date?: string
    /**
     * End date of travel
     */
    travel_end?: string
    /**
     * Start date of travel
     */
    travel_start?: string
    /**
     * The suggested destinations
     */
    suggested_destinations?: string
    /**
     * The destination airport. Make sure to use the IATA code of the airport
     */
    destination_airport?: string
    /**
     * The country based on the location the user intends to visit
     */
    country?: string
    /**
     * The city based on the location the user intends to visit
     */
    city?: string
    /**
     * This could be the state, district, or region of interest to the user
     */
    region?: string
    /**
     * The neighborhood the user is interested in
     */
    neighborhood?: string
    /**
     * The starting date and time for travel
     */
    departing_departure_date?: string
    /**
     * The arrival date and time at the destination for the travel
     */
    departing_arrival_date?: string
    /**
     * The number of adults staying
     */
    num_adults?: number
    /**
     * The official IATA code of origin airport
     */
    origin_airport?: string
    /**
     * The starting date and time of the return journey
     */
    returning_departure_date?: string
    /**
     * The date and time when the return journey is complete
     */
    returning_arrival_date?: string
    /**
     * The number of children staying
     */
    num_children?: number
    /**
     * This represents the hotels score relative to other hotels to an advertiser
     */
    hotel_score?: string
    /**
     * The postal /zip code
     */
    postal_code?: string
    /**
     * The number of infants staying
     */
    num_infants?: number
    /**
     * Any preferred neighborhoods for the stay
     */
    preferred_neighborhoods?: string
    /**
     * The minimum and maximum hotel star rating supplied as a tuple. This is what the user would use for filtering hotels
     */
    preferred_star_ratings?: string
    /**
     * The suggested hotels
     */
    suggested_hotels?: string
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
   * The URL of the web page where the event took place.
   */
  event_source_url?: string
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
   * [Deprecated] Use Products field.
   */
  brands?: string[]
  /**
   * Deprecated. Use User Data sc_click_id field.
   */
  click_id?: string
  /**
   * Deprecated. Use Event ID field.
   */
  client_dedup_id?: string
  /**
   * Deprecated. Use Custom Data currency field.
   */
  currency?: string
  /**
   * Deprecated. No longer supported.
   */
  description?: string
  /**
   * Deprecated. Use App Data deviceName field.
   */
  device_model?: string
  /**
   * Deprecated. Use User Data email field.
   */
  email?: string
  /**
   * Deprecated. Use Action Source field.
   */
  event_conversion_type?: string
  /**
   * Deprecated. No longer supported.
   */
  event_tag?: string
  /**
   * Deprecated. Use Event Name field.
   */
  event_type?: string
  /**
   * Deprecated. Use User Data idfv field.
   */
  idfv?: string
  /**
   * Deprecated. Use User Data client_ip_address field.
   */
  ip_address?: string
  /**
   * Deprecated. Use products field.
   */
  item_category?: string
  /**
   * Deprecated. Use products field.
   */
  item_ids?: string
  /**
   * Deprecated. No longer supported.
   */
  level?: string
  /**
   * Deprecated. Use User Data madid field.
   */
  mobile_ad_id?: string
  /**
   * Deprecated. Use Custom Data num_items field.
   */
  number_items?: string
  /**
   * Deprecated. Use App Data version field.
   */
  os_version?: string
  /**
   * Deprecated. Use Event Source URL field.
   */
  page_url?: string
  /**
   * Deprecated. Use User Data phone field.
   */
  phone_number?: string
  /**
   * Deprecated. Use Custom Data value field.
   */
  price?: number
  /**
   * Deprecated. Use Custom Data search_string field.
   */
  search_string?: string
  /**
   * Deprecated. Use Custom Data sign_up_method field.
   */
  sign_up_method?: string
  /**
   * Deprecated. Use Event Timestamp field.
   */
  timestamp?: string
  /**
   * Deprecated. Use Custom Data order_id field.
   */
  transaction_id?: string
  /**
   * Deprecated. Use User Data client_user_agent field.
   */
  user_agent?: string
  /**
   * Deprecated. Use User Data sc_cookie1 field.
   */
  uuid_c1?: string
}
