// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User's unique user ID. UserID should be string and it is used as identifier when sending data to Insider. Either Anonymous ID or UUID is mandatory to send data
   */
  uuid?: string
  /**
   * Segment Anonymous ID. It is used as identifier when sending data to Insider. Either Anonymous ID or UUID is mandatory to send data
   */
  segment_anonymous_id?: string
  /**
   * The event name
   */
  name: string
  /**
   * When the event occurred
   */
  timestamp: string | number
  /**
   * Event Parameters store the information about an Event.
   */
  parameters?: {
    url?: string
    /**
     * Product id displayed on the list
     */
    product_id?: string
    /**
     * Product category being viewed
     */
    taxonomy?: string
    /**
     * Name of the product being viewed
     */
    name?: string
    /**
     * Variant of the product
     */
    variant_id?: number
    /**
     * Sale Price ($) of the product being viewed
     */
    unit_sale_price?: number
    /**
     * Price ($) of the product being viewed
     */
    unit_price?: number
    /**
     * Quantity of a product
     */
    quantity?: number
    product_image_url?: string
    /**
     * Order or Basket Id
     */
    event_group_id?: string
    referrer?: string
    user_agent?: string
    [k: string]: unknown
  }
  /**
   * Product details for the given event.
   */
  products?: {
    /**
     * Product ID
     */
    product_id?: string
    /**
     * Category
     */
    taxonomy?: string
    /**
     * Name
     */
    name?: string
    /**
     * Unit sale price of the product.
     */
    unit_sale_price?: number
    /**
     * Price
     */
    unit_price?: number
    /**
     * Quantity
     */
    quantity?: number
    /**
     * Product Url
     */
    url?: string
    /**
     * Product Image Url
     */
    product_image_url?: string
    [k: string]: unknown
  }[]
  /**
   * User Properties defines all the details about a user.
   */
  attributes?: {
    /**
     * Email address of a user
     */
    email?: string
    /**
     * User's phone number in E.164 format (e.g. +6598765432), can be used as an identifier.
     */
    phone?: string
    /**
     * Age of a user
     */
    age?: number
    /**
     * User’s birthday
     */
    birthday?: string
    /**
     * First name of a user
     */
    name?: string
    /**
     * Gender of a user
     */
    gender?: string
    /**
     * Last name of a user
     */
    surname?: string
    app_version?: string
    /**
     * IDFA used for Google and Facebook remarketing
     */
    idfa?: string
    model?: string
    last_ip?: string
    city?: string
    country?: string
    carrier?: string
    os_version?: string
    platform?: string
    timezone?: string
    locale?: string
    [k: string]: unknown
  }
}
