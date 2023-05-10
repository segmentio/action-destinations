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
     * Only respected in email-based projects. Whether or not a new user should be created if the request includes a userId that doesn't yet exist in the Iterable project.
     */
    preferUserId?: boolean
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
    id: string
    name: string
    sku?: string
    quantity: number
    price: number
    description?: string
    categories?: string
    url?: string
    imageUrl?: string
    dataFields?: {
      [k: string]: unknown
    }
    [k: string]: unknown
  }[]
}
