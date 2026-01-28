// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Specify the type of Facebook Conversions API event to send.
   */
  event_config: {
    /**
     * Facebook Conversions API Event Name to send. Select 'Custom Event' to send a non standard event.
     */
    event_name: string
    /**
     * Custom event name to send to Facebook
     */
    custom_event_name?: string
    /**
     * Show all fields, even those which are not relevant to the selected Event Name.
     */
    show_fields?: boolean
  }
  /**
   * The category of the content associated with the event.
   */
  content_category?: string
  /**
   * Product IDs associated with the event, such as SKUs (e.g. ['ABC123', 'XYZ789']). Accepts a single string value or array of strings.
   */
  content_ids?: string[]
  /**
   * The name of the page or product associated with the event.
   */
  content_name?: string
  /**
   * If the IDs being passed in content_ids or contents parameter are IDs of products, then the value should be product. If product group IDs are being passed, then the value should be product_group. If no content_type is provided, Meta will match the event to every item that has the same ID, independent of its type.
   */
  content_type?: string
  /**
   * A list of JSON objects that contain the product IDs associated with the event plus information about the products. ID and quantity are required fields.
   */
  contents?: {
    /**
     * The product ID of the purchased item.
     */
    id: string
    /**
     * The number of items purchased.
     */
    quantity: number
    /**
     * The price of the item.
     */
    item_price?: number
    [k: string]: unknown
  }[]
  /**
   * The currency for the value specified. Currency must be a valid ISO 4217 three-digit currency code.
   */
  currency?: string
  /**
   * Category of the delivery
   */
  delivery_category?: string
  /**
   * The number of items when checkout was initiated.
   */
  num_items?: number
  /**
   * Predicted lifetime value of a subscriber as defined by the advertiser and expressed as an exact value.
   */
  predicted_ltv?: number
  /**
   * The net revenue associated with the purchase.
   */
  net_revenue?: number
  /**
   * The string entered by the user for the search.
   */
  search_string?: string
  /**
   * The status of the registration. true for completed registrations, false otherwise.
   */
  status?: boolean
  /**
   * A numeric value associated with this event. This could be a monetary value or a value in some other metric.
   */
  value?: number
  /**
   * The custom data object can be used to pass custom properties.
   */
  custom_data?: {
    [k: string]: unknown
  }
  /**
   * This ID can be any unique string. Event ID is used to deduplicate events sent both the server side Conversions API and the browser Pixel.
   */
  eventID?: string
  /**
   * The URL of the page where the event occurred. Can be used to override the default URL taken from the current page.
   */
  eventSourceUrl?: string
  /**
   * User data to be sent with the event. This can include hashed identifiers like email, phone number, etc.
   */
  userData?: {
    /**
     * A unique identifier for the user from your system
     */
    external_id?: string
    /**
     * Email address of the user
     */
    em?: string
    /**
     * Phone number of the user
     */
    ph?: string
    /**
     * First name of the user
     */
    fn?: string
    /**
     * Last name of the user
     */
    ln?: string
    /**
     * Gender of the user. If unknown leave blank.
     */
    ge?: string
    /**
     * Date of birth of the user
     */
    db?: string
    /**
     * City of the user
     */
    ct?: string
    /**
     * State of the user. Facebook expects the 2-letter abbreviation for US states. For example, "CA" for California, or "NY" for New York.
     */
    st?: string
    /**
     * ZIP or postal code of the user. For example, "94025" for Menlo Park, CA, or "10001" for New York City.
     */
    zp?: string
    /**
     * The country of the user. Facebook expects the 2-letter ISO 3166-1 alpha-2 country code. For example, "US" for the United States, or "GB" for the United Kingdom.
     */
    country?: string
  }
}
