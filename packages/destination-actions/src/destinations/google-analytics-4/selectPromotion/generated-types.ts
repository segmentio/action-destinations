// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  client_id: string
  /**
   * The name of the promotional creative.
   */
  creative_name?: string
  /**
   * The name of the promotional creative slot associated with the event.
   */
  creative_slot?: string
  /**
   * The ID of the location.
   */
  location_id?: string
  /**
   * The ID of the promotion associated with the event.
   */
  promotion_id?: string
  /**
   * The name of the promotion associated with the event.
   */
  promotion_name?: string
  /**
   * The list of products in the event.
   */
  items?: {
    /**
     * Identifier for the product being purchased.
     */
    item_id?: string
    /**
     * Name of the product being purchased.
     */
    item_name?: string
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location.
     */
    affiliation?: string
    /**
     * Coupon code used for a purchase.
     */
    coupon?: string
    /**
     * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
     */
    currency?: string
    /**
     * The name of the promotional creative.
     */
    creative_name?: string
    /**
     * The name of the promotional creative slot associated with the item.
     */
    creative_slot?: string
    /**
     * Monetary value of discount associated with a purchase.
     */
    discount?: number
    /**
     * The index of the item in a list.
     */
    index?: number
    /**
     * Brand associated with the product.
     */
    item_brand?: string
    /**
     * Category of the product.
     */
    item_category?: string
    /**
     * The second category of the product.
     */
    item_category2?: string
    /**
     * The third category of the product.
     */
    item_category3?: string
    /**
     * The fourth category of the product.
     */
    item_category4?: string
    /**
     * The fifth category of the product.
     */
    item_category5?: string
    /**
     * The ID of the list in which the item was presented to the user.
     */
    item_list_id?: string
    /**
     * The name of the list in which the item was presented to the user.
     */
    item_list_name?: string
    /**
     * Variant of the product (e.g. Black).
     */
    item_variant?: string
    /**
     * The location associated with the item.
     */
    location_id?: string
    /**
     * Price of the product being purchased, in units of the specified currency parameter.
     */
    price?: number
    /**
     * The ID of the promotion associated with the item.
     */
    promotion_id?: string
    /**
     * The name of the promotion associated with the item.
     */
    promotion_name?: string
    /**
     * Item quantity.
     */
    quantity?: number
  }[]
}
