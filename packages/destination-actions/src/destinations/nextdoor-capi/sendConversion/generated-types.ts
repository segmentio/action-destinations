// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to track
   */
  event_name: string
  /**
   * A unique ID for the event. This is used to deduplicate events sent by the browser and server.
   */
  event_id?: string
  /**
   * UCT Timestamp with ISO 8601 format. For example, 2022-11-23T03:30:52Z
   */
  event_time: string
  /**
   * The timezone of the event. TODO: Add more information about this field.
   */
  event_timezone?: string
  /**
   * Indicates the channel through which conversion happened.
   */
  action_source: string
  /**
   * The browser URL where the event happened (required for web events).
   */
  action_source_url?: string
  /**
   * True indicates data can be used for optimization. False indicates the data will only be used for attribution
   */
  delivery_optimization: boolean
  /**
   * Flag to indicate if this is a test event.
   */
  test_event: boolean
  /**
   * ID of partners like Segment
   */
  partner_id: string
  /**
   * Customer profile data used to match with Nextdoor users. At least one of the fields is required.
   */
  customer: {
    /**
     * Customer email address
     */
    email?: string
    /**
     * Phone number format should consist of exactly ten digits, devoid of any special characters or international country codes e.g. 4129614932
     */
    phone_number?: string
    /**
     * Customer first name.
     */
    first_name?: string
    /**
     * Customer last name.
     */
    last_name?: string
    /**
     * Customer date of birth in ISO 8601 format. For example, 1990-01-01
     */
    date_of_birth?: string
    /**
     * Customer street address.
     */
    street_address?: string
    /**
     * Customer city.
     */
    city?: string
    /**
     * Customer State.
     */
    state?: string
    /**
     * Customer Customer country code (2-letter country codes in ISO 3166-1 alpha-2).
     */
    country?: string
    /**
     * Customer Zip code.
     */
    zip_code?: string
    /**
     * Next Door Click ID - ndclid parameter from the URL
     */
    click_id?: string
    /**
     * Customer IP Address Must be a valid IPV4 or IPV6 address.
     */
    client_ip_address?: string
  }
  /**
   * Custom objects contains fields specific to advertisers that are not already covered in standard fields.
   */
  custom?: {
    /**
     * Required for purchase events. Total numeric value associated with the event. E.g. 99.99 denotes $99.99 USD. Currency is specified in the Currency field.
     */
    order_value?: number
    /**
     * Currency of the order value. Use the 3-letter currency code from ISO 4217 standard.
     */
    currency?: string
    /**
     * The order ID for this transaction. Required for offline events.
     */
    order_id?: string
    /**
     * How a product is delivered
     */
    delivery_category: string
  }
  /**
   * Product details associated with the event.
   */
  product_context?: {
    /**
     * Product ID
     */
    id: string
    /**
     * Product Quantity
     */
    quantity?: number
    /**
     * Product Price
     */
    item_price?: number
    [k: string]: unknown
  }[]
  /**
   * Data about the source Mobile app. Required for app events
   */
  app?: {
    /**
     * A unique ID for advertisers mobile app ID from App store and Google Play Store.
     */
    app_id?: string
    /**
     * Users opt out settings for ATT
     */
    app_tracking_enabled?: boolean
    /**
     * Mobile app platform
     */
    platform?: string
    /**
     * Mobile app version
     */
    app_version?: string
  }
}
