// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The conversion event type. For custom events, you must use the predefined event name "custom". Please refer to the possible event types in [Pinterest API docs](https://developers.pinterest.com/docs/api/v5/#operation/events/create).
   */
  event_name: string
  /**
   * The source indicating where the conversion event occurred. This must be app_android, app_ios , web or offline.
   */
  action_source: string
  /**
   * Device IDs can be used to add and remove only anonymous users to/from a cohort. However, users with an assigned User ID cannot use Device ID to sync to a cohort.
   */
  event_time: string
  /**
   * A unique id string that identifies this event and can be used for deduping between events ingested via both the conversion API and Pinterest tracking.
   */
  event_id: string
  /**
   * URL of the web conversion event.
   */
  event_source_url?: string
  /**
   * When action_source is web or offline, it defines whether the user has opted out of tracking for web conversion events. While when action_source is app_android or app_ios, it defines whether the user has enabled Limit Ad Tracking on their iOS device, or opted out of Ads Personalization on their Android device.
   */
  opt_out?: boolean
  /**
   * Object containing customer information data. Note, It is required at least one of 1) em, 2) hashed_maids or 3) pair client_ip_address + client_user_agent..
   */
  user_data?: {
    /**
     * An email address in lowercase.
     */
    email?: string[]
    /**
     * User’s Google advertising ID (GAIDs) or Apple’s identifier for advertisers (IDFAs).
     */
    hashed_maids?: string[]
    /**
     * The IP address of the browser corresponding to the event.
     */
    client_ip_address?: string
    /**
     * User agent of the device the API call originated from.
     */
    client_user_agent?: string
    /**
     * A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code, even if all of the data is from the same country, as the country code is used for matching.
     */
    phone?: string[]
    /**
     * A first name in lowercase.
     */
    first_name?: string[]
    /**
     * A last name in lowercase.
     */
    last_name?: string[]
    /**
     * Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.
     */
    external_id?: string[]
    /**
     * Gender in lowercase. Either f or m.
     */
    gender?: string[]
    /**
     * A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.
     */
    date_of_birth?: string[]
    /**
     * A city in lowercase without spaces or punctuation. Example: menlopark.
     */
    city?: string[]
    /**
     * A two-letter state code in lowercase. Example: ca.
     */
    state?: string[]
    /**
     * A five-digit zip code for United States. For other locations, follow each country`s standards.
     */
    zip?: string[]
    /**
     * A two-letter country code in lowercase.
     */
    country?: string[]
  }
  /**
   * Object containing customer information data.
   */
  custom_data?: {
    /**
     * ISO-4217 currency code. If not provided, it will default to the currency set for the ad account.
     */
    currency?: string
    /**
     * Total value of the event. E.g. if there are multiple items in a checkout event, value should be the total price of all items
     */
    value?: number
    /**
     * Product IDs as an array of strings
     */
    content_ids?: string[]
    /**
     * Gender in lowercase. Either f or m.
     */
    contents?: {
      /**
       * The price of the Item
       */
      item_price?: number
      /**
       * The number of items purchased
       */
      quantity?: number
    }[]
    /**
     * Total number of products in the event.
     */
    num_items?: string
    /**
     * Order ID
     */
    order_id?: string
    /**
     * Search string related to the conversion event.
     */
    search_string?: string
    /**
     * opt_out_type is the field where we accept opt outs for your users’ privacy preference.  It can handle multiple values with commas separated.
     */
    opt_out_type?: string
  }
  /**
   * The app store app ID.
   */
  app_id?: string
  /**
   * Name of the app.
   */
  app_name: string
  /**
   * Version of the app.
   */
  app_version?: string
  /**
   * Brand of the user device.
   */
  device_brand?: string
  /**
   * User device’s mobile carrier.
   */
  device_carrier?: string
  /**
   * Model of the user device.
   */
  device_model?: string
  /**
   * Type of the user device.
   */
  device_type?: string
  /**
   * Version of the device operating system.
   */
  os_version?: string
  /**
   * Whether the event occurred when the user device was connected to wifi.
   */
  wifi?: boolean
  /**
   * Two-character ISO-639-1 language code indicating the user's language.
   */
  language?: string
}
