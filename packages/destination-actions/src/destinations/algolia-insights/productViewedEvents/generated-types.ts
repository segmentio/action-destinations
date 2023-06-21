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
}
