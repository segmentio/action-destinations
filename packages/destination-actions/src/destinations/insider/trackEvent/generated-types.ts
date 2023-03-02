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
    ta?: string
    /**
     * Name of the product being viewed
     */
    na?: string
    /**
     * Variant of the product
     */
    variant_id?: string
    /**
     * Sale Price ($) of the product being viewed
     */
    usp?: number
    /**
     * Price ($) of the product being viewed
     */
    up?: number
    /**
     * Quantity of a product
     */
    qu?: number
    piu?: string
    /**
     * Order or Basket Id
     */
    e_quid?: string
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
    ta?: string
    /**
     * Name
     */
    na?: string
    /**
     * Price
     */
    usp?: number
    /**
     * Price
     */
    up?: number
    /**
     * Quantity
     */
    qu?: number
    /**
     * Product Url
     */
    url?: string
    /**
     * Product Image Url
     */
    piu?: string
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
