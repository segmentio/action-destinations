// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment User ID value
   */
  segmentId?: string
  /**
   * Segment Anonymous ID value
   */
  anonymousId?: string
  /**
   * An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.
   */
  userIdentities?: {
    [k: string]: unknown
  }
  /**
   * Internal identifier of a product
   */
  productID: string
  /**
   * SKU of a product
   */
  sku: string
  /**
   * Quantity of a product
   */
  qty: number
  /**
   * Category of a product
   */
  category: string
  /**
   * Name of a product
   */
  name: string
  /**
   * Description of a product
   */
  description?: string
  /**
   * Price of a product
   */
  itemPrice?: number
  /**
   * URL of a product
   */
  url?: string
  /**
   * Image of a product
   */
  imageUrl?: string
  /**
   * Properties of a product (e.g brand, color, size)
   */
  properties?: {
    [k: string]: unknown
  }
}
