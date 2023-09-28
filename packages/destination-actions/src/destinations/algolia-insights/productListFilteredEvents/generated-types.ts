// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Populates the filters field in the Algolia Insights API, a list of up to 10 facet filters. Field should be an array of strings with format ${attribute}:${value}.
   */
  filters: {
    /**
     * The name of the Filter
     */
    attribute: string
    /**
     * The value of the Filter
     */
    value: string
  }[]
  /**
   * Name of the targeted search index.
   */
  index: string
  /**
   * Query ID of the list on which the item was clicked.
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
