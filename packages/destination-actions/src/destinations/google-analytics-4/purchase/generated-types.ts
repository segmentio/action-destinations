// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Uniquely identifies a user instance of a web client.
   */
  client_id: string
  /**
   * Store or affiliation from which this transaction occurred (e.g. Google Store).
   */
  affiliation?: string
  /**
   * Coupon code used for a purchase.
   */
  coupon?: string
  /**
   * Currency of the purchase or items associated with the event, in 3-letter ISO 4217 format.
   */
  currency: string
  /**
   * The list of products purchased.
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
     * Store or affiliation from which this transaction occurred (e.g. Google Store).
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
     * Brand associated with the product.
     */
    item_brand?: string
    /**
     * Product category.
     */
    item_category?: string
    /**
     * Variant of the product (e.g. Black).
     */
    item_variant?: string
    /**
     * Total tax associated with the transaction.
     */
    tax?: number
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
   * The unique identifier of a transaction.
   */
  transaction_id: string
  /**
   * Shipping cost associated with the transaction.
   */
  shipping?: number
  /**
   * Total tax associated with the transaction.
   */
  tax?: number
  /**
   * The monetary value of the event, in units of the specified currency parameter.
   */
  value?: number
}
