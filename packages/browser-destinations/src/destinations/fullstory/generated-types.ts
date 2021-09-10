// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The organization ID for FullStory.
   */
  orgId: string
  /**
   * Sends all page calls as tracking events to FullStory.
   */
  trackAllPages?: boolean
  /**
   * Sends pages with names to FullStory as tracking events.
   */
  trackNamedPages?: boolean
  /**
   * Sends pages that specify a category to Fullstory as tracking events.
   */
  trackCategorizedPages?: boolean
  /**
   * Sends pages to FullStory as tracking events.
   */
  trackPagesWithEvents?: boolean
}
