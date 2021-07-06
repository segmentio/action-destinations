// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  client_id: string
  /**
   * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
   */
  currency?: string
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
     * Item quantity.
     */
    quantity?: number
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location.
     */
    affiliation?: string
    /**
     * Coupon code used for a purchase.
     */
    coupon?: string
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
     * The name of the list in which the item was presented to the user.
     */
    item_list_name?: string
    /**
     * The ID of the list in which the item was presented to the user.
     */
    item_list_id?: string
    /**
     * Variant of the product (e.g. Black).
     */
    item_variant?: string
    /**
     * Price of the product being purchased, in units of the specified currency parameter.
     */
    price?: number
    /**
     * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
     */
    currency?: string
  }[]
  /**
   * The monetary value of the event, in units of the specified currency parameter.
   */
  value?: number
}
