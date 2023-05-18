// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Updates user data or adds a user if none exists
   */
  user: {
    /**
     * An email address that identifies a user profile in Iterable.
     */
    email?: string
    /**
     * A user ID that identifies a user profile in Iterable.
     */
    userId?: string
    /**
     * If you'd like to merge (rather than overwrite) a user profile's top-level objects with the values provided for them in the request body, set mergeNestedObjects to true.
     */
    mergeNestedObjects?: boolean
    /**
     * Data to store on the user profile.
     */
    dataFields?: {
      [k: string]: unknown
    }
  }
  /**
   * Individual items in the cart. Each item must contain `id`, `name`, `price`, and `quantity`. Extra values are added to dataFields.
   */
  items: {
    /**
     * The unique identifier of the commerce item in the cart.
     */
    id: string
    /**
     * The name or title of the product in the cart.
     */
    name: string
    /**
     * The Stock Keeping Unit (SKU) code that identifies the specific product.
     */
    sku?: string
    /**
     * The quantity of the product in the cart.
     */
    quantity: number
    /**
     * The unit price of the product in the cart.
     */
    price: number
    /**
     * A brief description of the product in the cart.
     */
    description?: string
    /**
     * A category name or label associated with the product in the cart.
     */
    categories?: string
    /**
     * The URL to view or purchase the product in the cart.
     */
    url?: string
    /**
     * The URL of an image representing the product in the cart.
     */
    imageUrl?: string
    [k: string]: unknown
  }[]
}
