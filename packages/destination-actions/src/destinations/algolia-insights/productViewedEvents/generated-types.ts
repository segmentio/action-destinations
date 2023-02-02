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
   * Query ID of the list on which the item was clicked.
   */
  queryID: string
  /**
   * The user's anonymous id. Optional if User ID is provided. See Segment [common fields documentation](https://segment.com/docs/connections/spec/common/)
   */
  anonymousID?: string
  /**
   * The ID associated with the user. Optional if Anonymous ID is provided. See Segment [common fields documentation](https://segment.com/docs/connections/spec/common/)
   */
  userID?: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string
}
