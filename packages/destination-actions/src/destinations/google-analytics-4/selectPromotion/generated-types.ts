// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  client_id: string
  /**
   * The ID of the location.
   */
  location_id?: string
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
     * The ID of a product promotion.
     */
    promotion_id?: string
    /**
     * The name of a product promotion.
     */
    promotion_name?: string
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location.
     */
    affiliation?: string
    /**
     * Coupon code used for a purchase.
     */
    coupon?: string
    /**
     * The name of a creative used in a promotional spot.
     */
    creative_name?: string
    /**
     * The name of a creative slot.
     */
    creative_slot?: string
    /**
     * Monetary value of discount associated with a purchase.
     */
    discount?: number
    /**
     * Brand associated with the product.
     */
    item_brand?: string
    /**
     * Category of the product.
     */
    item_category?: string
    /**
     * Variant of the product (e.g. Black).
     */
    item_variant?: string
    /**
     * The location associated with the event. If possible, set to the Google Place ID that corresponds to the associated item. Can also be overridden to a custom location ID string.
     */
    location_id?: string
    /**
     * Price of the product being purchased, in units of the specified currency parameter.
     */
    price?: number
    /**
     * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
     */
    currency?: string
  }[]
}
