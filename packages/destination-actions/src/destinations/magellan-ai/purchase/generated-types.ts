// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The monetary value of this event, in the specified currency
   */
  value: number
  /**
   * ISO 4217 three-digit currency code (e.g., "USD", "CAD", "AUD")
   */
  currency: string
  /**
   * The coupon or discount code applied to the cart
   */
  discountCode?: string
  /**
   * The unique ID for the order initiated by this checkout event
   */
  id?: string
  /**
   * The total number of items in the cart
   */
  quantity?: number
  /**
   * The list (array) of all products in the cart
   */
  lineItems?: {
    /**
     * The number of this product in the cart
     */
    quantity?: number
    /**
     * The price per unit of this product
     */
    value?: number
    /**
     * Your unique ID for this product
     */
    productId?: string
    /**
     * The name of this product
     */
    productName?: string
    /**
     * The type or category of this product
     */
    productType?: string
    /**
     * The vendor or brand for this product
     */
    productVendor?: string
    /**
     * The unique ID for this variant of the product
     */
    variantId?: string
    /**
     * The name of this variant of the product
     */
    variantName?: string
  }[]
  /**
   * Whether or not this customer is a first-time buyer from your store
   */
  isNewCustomer?: boolean
}
