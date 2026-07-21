// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Populates the ObjectIds field in the Algolia Insights API. Product ID of the clicked item.
   */
  objectID: string
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was clicked.
   */
  queryID?: string
  /**
   * Position of the click in the list of Algolia search results. Positions should start from 1, not 0.
   */
  position?: number
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
   * The name of the event to be send to Algolia. Defaults to 'Product Clicked'
   */
  eventName?: string
  /**
   * The type of event to send to Algolia. Defaults to 'click'
   */
  eventType?: string
}
