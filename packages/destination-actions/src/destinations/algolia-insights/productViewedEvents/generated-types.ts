// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Product ID of the clicked item.
   */
  objectID: string
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was viewed.
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
  /**
   * The name of the event to be send to Algolia. Defaults to 'Product Viewed'
   */
  eventName?: string
  /**
   * The type of event to send to Algolia. Defaults to 'view'
   */
  eventType?: string
}
