// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The AppLovin event to send.
   */
  name: string
  /**
   * When the event occurred. Must be in ISO 8601 format. Segment converts it to a Unix timestamp in milliseconds before sending to AppLovin. AppLovin rejects events more than 730 days old or more than 1 hour in the future.
   */
  event_time: string | number
  /**
   * The full URL of the page where the event occurred. Include it for web events, including events sent server-side. It can be omitted for app events.
   */
  event_source_url?: string
  /**
   * A unique ID for this event. AppLovin uses it to de-duplicate this event against the same event sent by the AppLovin Pixel, so it must match the dedupe ID on the Pixel event for the same conversion.
   */
  dedupe_id: string
  /**
   * User and device details used by AppLovin to match the event to a user. Required: ALEID, IP Address, User Agent, Event Source, and at least one of ALART, AXWRT, Client ID, Email, Phone or User ID. All other fields are optional. Email and phone are normalized and SHA-256 hashed before sending. ALEID, ALART and AXWRT are populated automatically by the AppLovin Conversions API Plugins destination.
   */
  user_data: {
    /**
     * Required. The aleid query parameter that AppLovin adds to your website URL after a user clicks an ad. Also stored in the _axeid cookie.
     */
    aleid: string
    /**
     * Required. The public IP address of the user. IPv4 is preferred.
     */
    client_ip_address: string
    /**
     * Required. The user agent of the browser or device.
     */
    client_user_agent: string
    /**
     * Required. Where the event came from.
     */
    esi: string
    /**
     * The alart query parameter that AppLovin adds to your URL after an ad click, used to attribute app users. Also stored in the _axart cookie. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    alart?: string
    /**
     * The axwrt value set by the AppLovin Pixel, stored in the _axwrt cookie. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    axwrt?: string
    /**
     * A stable first-party identifier for the user. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    client_id?: string
    /**
     * The user's email address. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    email?: string
    /**
     * The user's phone number, including the country code. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    phone?: string
    /**
     * Your unique customer identifier. Must be at least 6 characters. Shorter values are ignored. At least one of ALART, AXWRT, Client ID, Email, Phone or User ID is required.
     */
    user_id?: string
    /**
     * The ISO 3166 billing country code.
     */
    country_code?: string
    /**
     * The IDFA or GAID of the device.
     */
    ifa?: string
    /**
     * The iOS identifier for vendor (IDFV).
     */
    idfv?: string
    /**
     * The operating system of the device. Accepted values are ios, android, macos, windows and desktop_os. Segment values such as iOS, iPadOS, Android, macOS and Windows are converted automatically (case-insensitive); anything else is sent as desktop_os.
     */
    os?: string
    /**
     * A session identifier.
     */
    sid?: string
    /**
     * The billing ZIP code for US users. Only the first 5 characters are sent. If both US ZIP and Non US ZIP are provided, US ZIP is used.
     */
    us_zip?: string
    /**
     * The billing postal code for users outside the US. Sent as provided.
     */
    non_us_zip?: string
  }
  /**
   * The products involved in the event. Quantity is required for add_to_cart, remove_from_cart and purchase events.
   */
  items?: {
    /**
     * The ID of the item.
     */
    item_id: string
    /**
     * The name of the item.
     */
    item_name?: string
    /**
     * The brand of the item.
     */
    item_brand?: string
    /**
     * A unique ID for the variant of the item, such as a size or color.
     */
    item_variant_id?: string
    /**
     * The numeric category ID from AppLovin's supported category list, for example 1 for Animals & Pet Supplies. Must be an integer, not a category name. See the full list: https://support.applovin.com/en/growth/promoting-your-websites/track-and-optimize/events-and-objects#category-ids
     */
    item_category_id?: number
    /**
     * URL of an image of the item, ending in .png, .jpg or .jpeg.
     */
    image_url?: string
    /**
     * The unit price of the item. Use the discounted price if a discount applies.
     */
    price?: number
    /**
     * The quantity of the item.
     */
    quantity?: number
    /**
     * The discount applied to a single unit.
     */
    discount?: number
    /**
     * The supplier, company or store associated with the item.
     */
    affiliation?: string
  }[]
  /**
   * The three-letter ISO 4217 currency code, for example USD. Required for begin_checkout, purchase and generate_lead.
   */
  currency?: string
  /**
   * The monetary value of the event. For purchase this is the subtotal before tax and shipping. Required for begin_checkout, purchase and generate_lead.
   */
  value?: number
  /**
   * The unique ID of the transaction.
   */
  transaction_id?: string
  /**
   * The shipping cost. Use 0 if there is none.
   */
  shipping?: number
  /**
   * The tax amount. Use 0 if there is none.
   */
  tax?: number
  /**
   * Whether the customer is new. Only send if you are not using the AppLovin Shopify app or uploading order history data.
   */
  is_new_customer?: boolean
  /**
   * The payment method used.
   */
  payment_type?: string
  /**
   * The term the user searched for.
   */
  search_term?: string
  /**
   * The registration method used.
   */
  sign_up_method?: string
  /**
   * When enabled, Segment sends events to AppLovin in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. AppLovin accepts up to 100 per request.
   */
  batch_size?: number
}
