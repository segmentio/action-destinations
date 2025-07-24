// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Product IDs of the viewed items.
   */
  objectIDs: string[]
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the items were viewed.
   */
  queryID?: string
  /**
   * The ID associated with the user. If a user is authenticated, this should be set to the same value as the Authenticated User Token
   */
  userToken: string
  /**
   * The authenticated ID associated with the user.
   */
  authenticatedUserToken?: string
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
   * The name of the event to be send to Algolia. Defaults to 'Product List Viewed'
   */
  eventName?: string
  /**
   * The type of event to send to Algolia. Defaults to 'view'
   */
  eventType?: string
}
