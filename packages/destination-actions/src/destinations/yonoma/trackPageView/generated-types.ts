// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The details of the page being viewed.
   */
  pageDetails: {
    /**
     * Title of the page.
     */
    title?: string
    /**
     * Full URL of the page visited.
     */
    url: string
    /**
     * URL of the referring page.
     */
    referrer?: string
  }
  /**
   * Unique identifiers for the contact. At least one of userId or anonymousId is required.
   */
  identifiers: {
    /**
     * Unique user identifier from your app.
     */
    userId?: string
    /**
     * Anonymous identifier from Segment for tracking pre-identified activity.
     */
    anonymousId?: string
    /**
     * Contact's email address. Required if userId is not provided.
     */
    email?: string
  }
  /**
   * The Yonoma list to add the contact to.
   */
  listId: string
  /**
   * Additional properties associated with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event. Defaults to the current time if not provided.
   */
  timestamp?: string
}
