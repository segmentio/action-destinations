// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Include fields for travel or vehicle events.
   */
  event_spec_type?: string
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Pixel SDK documentation](https://business-api.tiktok.com/portal/docs?id=1739585696931842) for accepted event names.
   */
  event: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Order ID of the transaction.
   */
  order_id?: string
  /**
   * Shop ID of the transaction.
   */
  shop_id?: string
  /**
   * Related item details for the event.
   */
  contents?: {
    /**
     * Price of the item.
     */
    price?: number
    /**
     * Number of items.
     */
    quantity?: number
    /**
     * Category of the product item.
     */
    content_category?: string
    /**
     * ID of the product item.
     */
    content_id?: string
    /**
     * Name of the product item.
     */
    content_name?: string
    /**
     * Brand name of the product item.
     */
    brand?: string
  }[]
  /**
   * Product IDs associated with the event, such as SKUs. Do not populate this field if the 'Contents' field is populated. This field accepts a single string value or an array of string values.
   */
  content_ids?: string[]
  /**
   * Number of items when checkout was initiated. Used with the InitiateCheckout event.
   */
  num_items?: number
  /**
   * Type of the product item. When the `content_id` in the `Contents` field is specified as a `sku_id`, set this field to `product`. When the `content_id` in the `Contents` field is specified as an `item_group_id`, set this field to `product_group`.
   */
  content_type?: string
  /**
   * Currency for the value specified as ISO 4217 code.
   */
  currency?: string
  /**
   * Value of the order or items sold.
   */
  value?: number
  /**
   * A string description of the web event.
   */
  description?: string
  /**
   * The text string that was searched for.
   */
  query?: string
  /**
   * The text string entered by the user for the search. Optionally used with the Search event.
   */
  search_string?: string
  /**
   * A single phone number in E.164 standard format. TikTok Pixel will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string[]
  /**
   * A single email address. TikTok Pixel will be hash this value before sending to TikTok.
   */
  email?: string[]
  /**
   * The first name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  first_name?: string
  /**
   * The last name of the customer. The name should be in lowercase without any punctuation. Special characters are allowed.
   */
  last_name?: string
  /**
   * The address of the customer.
   */
  address?: {
    /**
     * The customer's city.
     */
    city?: string
    /**
     * The customer's country.
     */
    country?: string
    /**
     * The customer's Zip Code.
     */
    zip_code?: string
    /**
     * The customer's State.
     */
    state?: string
  }
  /**
   * Uniquely identifies the user who triggered the conversion event. TikTok Pixel will hash this value before sending to TikTok.
   */
  external_id?: string[]
  /**
   * Fields related to vehicle events.
   */
  vehicle_fields?: {
    /**
     * Postal code for the vehicle location.
     */
    postal_code?: string
    /**
     * Vehicle make/brand/manufacturer.
     */
    make?: string
    /**
     * Vehicle model.
     */
    model?: string
    /**
     * Year the vehicle was laucned in yyyy format.
     */
    year?: number
    /**
     * Vehicle status.
     */
    state_of_vehicle?: string
    /**
     * Vehicle mileage (in km or miles). Zero (0) for new vehicle.
     */
    mileage_value?: number
    /**
     * Mileage unites in miles (MI) or kilometers (KM).
     */
    mileage_unit?: string
    /**
     * Vehicle exterior color.
     */
    exterior_color?: string
    /**
     * Vehicle transmission type.
     */
    transmission?: string
    /**
     * Vehicle body type.
     */
    body_style?: string
    /**
     * Vehicle fuel type.
     */
    fuel_type?: string
    /**
     * Vehicle drivetrain.
     */
    drivetrain?: string
    /**
     * Minimum preferred price of the vehicle.
     */
    preferred_price_range_min?: number
    /**
     * Maximum preferred price of the vehicle.
     */
    preferred_price_range_max?: number
    /**
     * Vehicle trim.
     */
    trim?: string
    /**
     * Vehicle identification number. Maximum characters: 17.
     */
    vin?: string
    /**
     * Vehicle interior color.
     */
    interior_color?: string
    /**
     * Vehicle drivetrain.
     */
    condition_of_vehicle?: string
    /**
     * Optional for ViewContent. Use viewcontent_type to differentiate between soft lead landing pages.
     */
    viewcontent_type?: string
    /**
     * Optional for Search. Use search_type to differentiate other user searches (such as dealer lookup) from inventory search.
     */
    search_type?: string
    /**
     * Optional for CompleteRegistration. Use registration_type to differentiate between different types of customer registration on websites.
     */
    registration_type?: string
  }
  /**
   * Fields related to travel events.
   */
  travel_fields?: {
    /**
     * Hotel city location.
     */
    city?: string
    /**
     * Hotel region location.
     */
    region?: string
    /**
     * Hotel country location.
     */
    country?: string
    /**
     * Hotel check-in date.
     */
    checkin_date?: string
    /**
     * Hotel check-out date.
     */
    checkout_date?: string
    /**
     * Number of adults.
     */
    num_adults?: number
    /**
     * Number of children.
     */
    num_children?: number
    /**
     * Number of infants flying.
     */
    num_infants?: number
    /**
     * Suggested hotels. This can be a single string value or an array of string values.
     */
    suggested_hotels?: string[]
    /**
     * Date of flight departure. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD
     */
    departing_departure_date?: string
    /**
     * Date of return flight. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD
     */
    returning_departure_date?: string
    /**
     * Origin airport.
     */
    origin_airport?: string
    /**
     * Destination airport.
     */
    destination_airport?: string
    /**
     * If a client has a destination catalog, the client can associate one or more destinations in the catalog with a specific flight event. For instance, link a particular route to a nearby museum and a nearby beach, both of which are destinations in the catalog. This field accepts a single string value or an array of string values.
     */
    destination_ids?: string[]
    /**
     * The date and time for arrival at the destination of the outbound journey. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD
     */
    departing_arrival_date?: string
    /**
     * The date and time when the return journey is completed. Accepted date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD
     */
    returning_arrival_date?: string
    /**
     * Class of the flight ticket, must be: "eco", "prem", "bus", "first".
     */
    travel_class?: string
    /**
     * Represents the relative value of this potential customer to advertiser.
     */
    user_score?: number
    /**
     * The preferred number of stops the user is looking for. 0 for direct flight.
     */
    preferred_num_stops?: number
    /**
     * The start date of user's trip. Accept date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD.
     */
    travel_start?: string
    /**
     * The end date of user's trip. Accept date formats: YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD, and YYYY-MM-DDThh:mm:ssTZD.
     */
    travel_end?: string
    /**
     * A list of IDs representing destination suggestions for this user. This parameter is not applicable for the Search event. This field accepts a single string value or an array of string values.
     */
    suggested_destinations?: string[]
  }
}
