// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  uuid?: string | null
  /**
   * Anonymous user id.
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
  parameters?: {
    email_subject?: string
    campaign_id?: string
    campaign_name?: string
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
    variant_id?: string
    /**
     * Sale Price ($) of the product being viewed
     */
    unit_sales_price?: number
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
   * The list of products purchased.
   */
  products?: {
    /**
     * Product ID
     */
    product_id?: string
    /**
     * Taxonomy
     */
    taxonomy?: string
    /**
     * Name
     */
    name?: string
    /**
     * Price
     */
    unit_sales_price?: number
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
  attributes?: {
    /**
     * Email address of a user
     */
    email?: string
    /**
     * Phone number of a user
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
