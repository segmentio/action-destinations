// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of ecommerce event
   */
  eventType: string
  /**
   * List of items.
   */
  items: {
    /**
     * A unique identifier for the product (i.e. "T-Shirt").
     */
    productId: string
    /**
     * A unique identifier for the product variant (i.e. "Medium Blue T-Shirt").
     */
    productVariantId: string
    /**
     * The price of the product.
     */
    value: number
    /**
     * A link to the image of the product. The image should not be larger than 500kb. This image will be used when sending MMS text messages.
     */
    productImage?: string
    /**
     * The URL for the product.
     */
    productUrl?: string
    /**
     * The name of the product. This should be in a format that could be used directly in a message.
     */
    name?: string
    /**
     * Default: "USD". The currency used for the price in ISO 4217 format.
     */
    currency?: string
    /**
     * The number of products.
     */
    quantity?: number
  }[]
  /**
   * At least one identifier is required. Custom identifiers can be added as additional key:value pairs.
   */
  userIdentifiers: {
    /**
     * The user's phone number in E.164 format.
     */
    phone?: string
    /**
     * The user's email address.
     */
    email?: string
    /**
     * A primary ID for a user. Should be a UUID.
     */
    clientUserId?: string
    [k: string]: unknown
  }
  /**
   * Timestamp for the event, ISO 8601 format.
   */
  occurredAt?: string
}
