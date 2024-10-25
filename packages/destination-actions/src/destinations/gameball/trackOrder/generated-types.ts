// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the player in your database.
   */
  playerUniqueId: string
  /**
   * Player's unique mobile number.
   */
  mobile?: string
  /**
   * Player's unique email.
   */
  email?: string
  /**
   * Unique order ID which identifies the underlying order in your system, e.g. order number, invoice number. It will be used for reversing any reward or redemption transaction on Gameball.
   */
  orderId: string
  /**
   * The date this order was placed, as an ISO8601 timestamp. Defaults to now if not provided.
   */
  orderDate: string | number
  /**
   * The sum of all order items' prices, including discounts, shipping, taxes, and tips. (Note: totalPaid is part of the totalPrice). Must be positive.
   */
  totalPrice: number
  /**
   * The actual paid amount to the store. (Based on this amount, the player will be rewarded. Also, According to the Cashback Configuration). Must be positive.
   */
  totalPaid: number
  /**
   * The total shipping price of the order. Must be positive.
   */
  totalShipping?: number
  /**
   * The sum of all the taxes applied to the order in the shop currency. Must be positive.
   */
  totalTax?: number
  /**
   * Total discount applied on this order. Must be positive.
   */
  totalDiscount?: number
  /**
   * A list of line items, each containing information about an item in the order.
   */
  lineItems?: {
    /**
     * The ID of the product that the line item belongs to
     */
    productId?: string
    /**
     * The item's SKU (stock keeping unit).
     */
    sku?: string
    /**
     * The title of the product.
     */
    title?: string
    /**
     * Product category (fashion, electronics.. etc). It can be one category or multiple categories.
     */
    category?: string[]
    /**
     * Collection ID(s) to which the product belongs. It can be one collection or multiple collections. This will be also based on the available collections in your store.
     */
    collection?: string[]
    /**
     * Tag(s) attached to the item in the order.
     */
    tags?: string[]
    /**
     * Item weight. Must be positive.
     */
    weight?: number
    /**
     * The name of the item's supplier.
     */
    vendor?: string
    /**
     * Number of items purchased of this line item. Must be positive.
     */
    quantity?: number
    /**
     * The original price of the product before adding tax or discount. Note that: it should reflect the price of a single product ignoring quantity
     */
    price: number
    /**
     * The sum of all the taxes applied to the line item in the shop currency. Must be positive. Note that: It should reflect total taxes for line item considering quantity
     */
    taxes: number
    /**
     * Total discount applied on this line item. Must be positive. Note that: This value should reflect total discounts for line item considering quantity
     */
    discount: number
  }[]
  /**
   * An array of discount codes.
   */
  discountCodes?: string[]
  /**
   * Monetary value of the redeemed points to be used by that player while placing his order. Note:  If this field is set, then the holdReference value should be null. Also, both fields could be null.
   */
  redeemedAmount?: number
  /**
   * Hold reference ID received after calling Hold Points API. This is used in case you want to use already held points. Note:  If this field is set, then the redeemedAmount value should be null. Also, both fields could be null.
   */
  holdReference?: string
  /**
   * A boolean value indicating if the customer who placed this order is a guest. The default is false.
   */
  guest?: boolean
  /**
   * Key value pair(s) of any extra information about the order. The key values must be of type string or number
   */
  extra?: {
    [k: string]: unknown
  }
  /**
   * Merchant unique id or code
   */
  merchantId?: string
  /**
   * Merchant name
   */
  merchantName?: string
  /**
   * Branch unique id or code
   */
  branchId?: string
  /**
   * Branch name
   */
  branchName?: string
}
