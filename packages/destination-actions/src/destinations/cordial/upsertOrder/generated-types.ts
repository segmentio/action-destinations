// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.
   */
  userIdentities: {
    [k: string]: unknown
  }
  /**
   * Internal identifier of an order
   */
  orderID: string
  /**
   * Order purchase date
   */
  purchaseDate: string | number
  /**
   * Order status (e.g. completed/cancelled/returned)
   */
  status: string
  /**
   * Order total amount
   */
  totalAmount: number
  /**
   * Additional order properties (e.g. affiliation/tax/revenue)
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Order items
   */
  items: {
    /**
     * ID of the purchased item.
     */
    productID: string
    /**
     * SKU of the purchased item.
     */
    sku: string
    /**
     * Category of the purchased item.
     */
    category?: string
    /**
     * Name of the purchased item.
     */
    name: string
    /**
     * Manufacturer name of the purchased item.
     */
    manufacturerName?: string
    /**
     * Price of the purchased item.
     */
    itemPrice?: number
    /**
     * Quantity of the purchased item.
     */
    qty?: number
    /**
     * URL of the purchased item.
     */
    url?: string
    /**
     * Image URL of the purchased item.
     */
    imageUrl?: string
    /**
     * Additional properties of the purchased item.
     */
    properties?: {
      [k: string]: unknown
    }
  }[]
}
