// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Conversion event name. Please refer to the "Supported Web Events" section on in TikTok’s [Events API documentation](https://ads.tiktok.com/marketing_api/docs?id=1701890979375106) for accepted event names.
   */
  event: string
  /**
   * Any hashed ID that can identify a unique user/session.
   */
  event_id?: string
  /**
   * Timestamp that the event took place, in ISO 8601 format.
   */
  timestamp?: string
  /**
   * A single phone number or array of phone numbers in E.164 standard format. Segment will hash this value before sending to TikTok. e.g. +14150000000. Segment will hash this value before sending to TikTok.
   */
  phone_number?: string[]
  /**
   * A single email address or an array of email addresses. Segment will hash this value before sending to TikTok.
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
   * Order ID of the transaction.
   */
  order_id?: string
  /**
   * Shop ID of the transaction.
   */
  shop_id?: string
  /**
   * Uniquely identifies the user who triggered the conversion event. Segment will hash this value before sending to TikTok. TikTok Conversions Destination supports both string and string[] types for sending external ID(s).
   */
  external_id?: string[]
  /**
   * The value of the ttclid used to match website visitor events with TikTok ads. The ttclid is valid for 7 days. See [Set up ttclid](https://ads.tiktok.com/marketing_api/docs?rid=4eezrhr6lg4&id=1681728034437121) for details.
   */
  ttclid?: string
  /**
   * TikTok Cookie ID. If you also use Pixel SDK and have enabled cookies, Pixel SDK automatically saves a unique identifier in the `_ttp` cookie. The value of `_ttp` is used to match website visitor events with TikTok ads. You can extract the value of `_ttp` and attach the value here. To learn more about the `ttp` parameter, refer to [Events API 2.0 - Send TikTok Cookie](https://ads.tiktok.com/marketing_api/docs?id=%201771100936446977) (`_ttp`).
   */
  ttp?: string
  /**
   * ID of TikTok leads. Every lead will have its own lead_id when exported from TikTok. This feature is in Beta. Please contact your TikTok representative to inquire regarding availability
   */
  lead_id?: string
  /**
   * Lead source of TikTok leads. Please set this field to the name of your CRM system, such as HubSpot or Salesforce.
   */
  lead_event_source?: string
  /**
   * The BCP 47 language identifier. For reference, refer to the [IETF BCP 47 standardized code](https://www.rfc-editor.org/rfc/bcp/bcp47.txt).
   */
  locale?: string
  /**
   * The page URL where the conversion event took place.
   */
  url?: string
  /**
   * The page referrer.
   */
  referrer?: string
  /**
   * IP address of the browser.
   */
  ip?: string
  /**
   * User agent from the user’s device.
   */
  user_agent?: string
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
   * Product IDs associated with the event, such as SKUs.
   */
  content_ids?: string[]
  /**
   * Category of the delivery.
   */
  delivery_category?: string
  /**
   * Number of items when checkout was initiated. Used with the InitiateCheckout event.
   */
  num_items?: number
  /**
   * Predicted lifetime value of a subscriber as defined by the advertiser and expressed as an exact value.
   */
  predicted_ltv?: number
  /**
   * The text string entered by the user for the search. Used with the Search event.
   */
  search_string?: string
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
   * Suggested hotels.
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
  destination_airiport?: string
  /**
   * If a client has a destination catalog, the client can associate one or more destinations in the catalog with a specific flight event. For instance, link a particular route to a nearby museum and a nearby beach, both of which are destinations in the catalog.
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
   * A list of IDs representing destination suugestions for this user. This parameter is not applicable for the Search event.
   */
  suggested_destinations?: string[]
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
   * Vehicle status. Supported values: "New", "Used", "CPO".
   */
  state_of_vehicle?: string
  /**
   * Vehicle mileage detail.
   */
  mileage?: {
    /**
     * Vehicle mileage (in km or miles). Zero (0) for new vehicle.
     */
    value?: number
    /**
     * Mileage unites in miles (MI) or kilometers (KM).
     */
    unit?: string
  }
  /**
   * Vehicle exterior color.
   */
  exterior_color?: string
  /**
   * Vehicle transmission type. Supported values: "Automatic", "Manual", "Other".
   */
  transmission?: string
  /**
   * Vehicle body type. Supported values: "Convertible", "Coupe", "Hatchback", "Minivan", "Truck", "SUV", "Sedan", "Van", "Wagon", "Crossover", "Other".
   */
  body_style?: string
  /**
   * Vehicle fuel type. Supported values: "Diesel", "Electric", "Flex", "Gasoline", "Hybrid", "Other".
   */
  fuel_type?: string
  /**
   * Vehicle drivetrain. Supported values: "AWD", "FOUR_WD", "FWD", "RWD", "TWO_WD", "Other".
   */
  drivetrain?: string
  /**
   * Vehicle price range.
   */
  preferred_price_range?: {
    /**
     * Minimum preferred price of the vehicle.
     */
    min?: number
    /**
     * Maximum preferred price of the vehicle.
     */
    max?: number
  }
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
   * Vehicle drivetrain. Supported values: "Excellent", "Good", "Fair", "Poor", "Other".
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
  /**
   * Use this field to flag an event for limited data processing. TikTok will recognize this parameter as a request for limited data processing, and will limit its processing activities accordingly if the event shared occurred in an eligible location. To learn more about the Limited Data Use feature, refer to [Events API 2.0 - Limited Data Use](https://ads.tiktok.com/marketing_api/docs?id=1771101204435970).
   */
  limited_data_use?: boolean
  /**
   * Use this field to specify that events should be test events rather than actual traffic. You can find your Test Event Code in your TikTok Events Manager under the "Test Event" tab. You'll want to remove your Test Event Code when sending real traffic through this integration.
   */
  test_event_code?: string
}
