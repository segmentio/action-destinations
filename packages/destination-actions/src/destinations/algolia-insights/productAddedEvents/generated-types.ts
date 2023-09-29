// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Populates the ObjectIds field in the Algolia Insights API with a single ObjectId (productId) of the product added.
   */
  product: string
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was purchased.
   */
  queryID?: string
  /**
   * The ID associated with the user.
   */
  userToken: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string
  /**
   * Additional fields for this event. This field may be useful for Algolia Insights fields which are not mapped in Segment.
   */
  extraProperties?: {
    [k: string]: unknown
  }
}
