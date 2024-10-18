// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This field allows you to specify where your conversions occurred. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event) for supported values.
   */
  action_source: string
  /**
   * The currency for the value specified. Currency must be a valid ISO 4217 three-digit currency code.
   */
  currency: string
  /**
   * A Unix timestamp in seconds indicating when the actual event occurred. Facebook will automatically convert ISO 8601 timestamps to Unix.
   */
  event_time: string
  /**
   * These parameters are a set of identifiers Facebook can use for targeted attribution. You must provide at least one of the following parameters in your request. More information on recommended User Data parameters in Facebook’s [Best Practices for Conversions API](https://www.facebook.com/business/help/308855623839366).
   */
  user_data: {
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
     * The Facebook click ID value stored in the _fbc browser cookie under your domain.
     */
    fbc?: string
    /**
     * The Facebook browser ID value stored in the _fbp browser cookie under your domain.
     */
    fbp?: string
    /**
     * The subscription ID for the user in this transaction.
     */
    subscriptionID?: string
    /**
     * The ID associated with a lead generated by Facebook`s Lead Ads.
     */
    leadID?: number
    /**
     * The ID issued by Facebook when a person first logs into an instance of an app.
     */
    fbLoginID?: number
    /**
     * This field represents unique application installation instances. Note: This parameter is for app events only.
     */
    anonId?: string
    /**
     * Your mobile advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device.
     */
    madId?: string
    /**
     * The ID issued by Facebook identity partner.
     */
    partner_id?: string
    /**
     * The name of the Facebook identity partner.
     */
    partner_name?: string
  }
  /**
   * These fields support sending app events to Facebook through the Conversions API. For more information about app events support in the Conversions API, see the Facebook docs [here](https://developers.facebook.com/docs/marketing-api/conversions-api/app-events).
   *   App events sent through the Conversions API must be associated with a dataset.
   *   Instructions for creating a dataset can be found [here](https://www.facebook.com/business/help/750785952855662?id=490360542427371). Once a dataset is created, the dataset ID
   *   can be substituted for the pixel ID in the destination settings.
   */
  app_data_field?: {
    /**
     * Segment will not send app events to Facebook by default. Enable this once you have created a dataset in Facebook and are ready to begin sending app events.
     */
    use_app_data?: boolean
    /**
     * *Required for app events*
     *             Use this field to specify ATT permission on an iOS 14.5+ device. Set to 0 for disabled or 1 for enabled.
     */
    advertiser_tracking_enabled?: boolean
    /**
     * *Required for app events*
     *             A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use 0 for disabled, 1 for enabled.
     */
    application_tracking_enabled?: boolean
    /**
     * *Required for app events* Example: 'i2'.
     */
    version?: string
    /**
     * Example: 'com.facebook.sdk.samples.hellofacebook'.
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
     * This field represents unique application installation instances. Note: This parameter is for app events only.
     */
    anonId?: string
    /**
     * Your mobile advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device.
     */
    madId?: string
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
   * A numeric value associated with this event. This could be a monetary value or a value in some other metric.
   */
  value: number
  /**
   * The content IDs associated with the event, such as product SKUs.
   */
  content_ids?: string[]
  /**
   * The name of the page or product associated with the event.
   */
  content_name?: string
  /**
   * The content type should be set to product or product_group. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data) for more information.
   */
  content_type?: string
  /**
   * A list of JSON objects that contain the product IDs associated with the event plus information about the products. ID and quantity are required fields.
   */
  contents?: {
    /**
     * The product ID of the purchased item.
     */
    id?: string
    /**
     * The number of items purchased.
     */
    quantity?: number
    /**
     * The price of the item.
     */
    item_price?: number
    /**
     * The type of delivery for a purchase event. Supported values are "in_store", "curbside", and "home_delivery".
     */
    delivery_category?: string
  }[]
  /**
   * This ID can be any unique string. Event ID is used to deduplicate events sent by both Facebook Pixel and Conversions API.
   */
  event_id?: string
  /**
   * The browser URL where the event happened. The URL must begin with http:// or https:// and should match the verified domain. This is required if the action source is "website."
   */
  event_source_url?: string
  /**
   * The number of items when checkout was initiated.
   */
  num_items?: number
  /**
   * The custom data object can be used to pass custom properties. See [Facebook documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data#custom-properties) for more information.
   */
  custom_data?: {
    [k: string]: unknown
  }
  /**
   * The Data Processing Options to send to Facebook. If set to true, Segment will send an array to Facebook indicating events should be processed with Limited Data Use (LDU) restrictions. More information can be found in [Facebook’s documentation](https://developers.facebook.com/docs/marketing-apis/data-processing-options).
   */
  data_processing_options?: boolean
  /**
   * A country that you want to associate to the Data Processing Options. Accepted values are 1, for the United States of America, or 0, to request that Facebook geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.
   */
  data_processing_options_country?: number
  /**
   * A state that you want to associate to the Data Processing Options. Accepted values are 1000, for California, or 0, to request that Facebook geolocates the event using IP address. This is required if Data Processing Options is set to true. If nothing is provided, Segment will send 0.
   */
  data_processing_options_state?: number
}
