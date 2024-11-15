// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Array of product items that the user purchased.
   */
  items: {
    /**
     * Unique identifier for the product.
     */
    productId: string
    /**
     * Unique identifier for the product variant.
     */
    productVariantId: string
    /**
     * URL to the product image.
     */
    productImage?: string
    /**
     * URL to the product page.
     */
    productUrl?: string
    /**
     * Name of the product.
     */
    name: string
    /**
     * Price information for the product.
     */
    price?: {
      [k: string]: unknown
    }[]
    /**
     * Quantity of the product.
     */
    quantity: number
  }[]
  /**
   * Timestamp of when the action occurred in ISO 8601 format.
   */
  occurredAt?: string
  /**
   * Phone number of the user associated with the action. E.164 format is required. This field is required if either email or an externalIdentifier is not provided.
   */
  phone?: string
  /**
   * Email of the user associated with the action. This field is required if either phone or an externalIdentifier is not provided.
   */
  email?: string
  /**
   * (optional) Your primary ID for a user. This field is required if either phone, email, or a customIdentifier is not provided.
   */
  clientUserId?: string
  /**
   * (optional) Namespaced custom identifiers and their values. This field is required if either phone, email, or a clientUserId is not provided.
   */
  customIdentifiers?: {
    [k: string]: unknown
  }
}
