// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The number of items added to the cart
   */
  quantity: number
  /**
   * The monetary value of this event, in the specified currency
   */
  value: number
  /**
   * ISO 4217 three-digit currency code (e.g., "USD", "CAD", "AUD")
   */
  currency: string
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
}
