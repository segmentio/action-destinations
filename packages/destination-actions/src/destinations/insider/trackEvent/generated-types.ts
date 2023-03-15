// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If true, Email will be sent as identifier to Insider.
   */
  email_as_identifier?: boolean
  /**
   * If true, Phone Number will be sent as identifier to Insider
   */
  phone_number_as_identifier?: boolean
  /**
   * User's unique identifier. The UUID string is used as identifier when sending data to Insider. UUID is required if the Anonymous Id field is empty.
   */
  uuid?: string
  /**
   * An Anonymous Identifier. The Anonymous Id string is used as identifier when sending data to Insider. Anonymous Id is required if the UUID field is empty.
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
   * Event Parameters store information about an event.
   */
  parameters?: {
    url?: string
    /**
     * The product id associated with the product.
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
     * Sale Price ($) of the product being viewed. This is a numeric field. e.g. 9.90 for $9.90c.
     */
    unit_sale_price?: number
    /**
     * Price ($) of the product being viewed. This is a numeric field. e.g. 9.90 for $9.90c.
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
