// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An array of objects representing the purchased items. Each object must contains a product_id field.
   */
  products: {
    product_id: string
  }[]
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was clicked.
   */
  queryID: string
  /**
   * The user's anonymous id.
   */
  anonymousID: string
  /**
   * The ID associated with the user
   */
  userID?: string
}
