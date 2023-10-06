// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An anonymous identifier
   */
  anonymousId?: string
  /**
   * Event name
   */
  event?: string
  /**
   * Properties to associate with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp: string
  /**
   * The users's IP address.
   */
  ipAddress?: string
  /**
   * Timezone
   */
  timezone?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * UTM campaign information.
   */
  campaign?: {
    /**
     * The name of the campaign.
     */
    name?: string
    /**
     * The source of the campaign.
     */
    source?: string
    /**
     * The medium of the campaign.
     */
    medium?: string
    /**
     * The term of the campaign.
     */
    term?: string
    /**
     * The content of the campaign.
     */
    content?: string
  }
  /**
   * Information about the page where the event occurred.
   */
  page?: {
    /**
     * The URL of the page where the event occurred.
     */
    url?: string
    /**
     * The title of the page where the event occurred.
     */
    title?: string
    /**
     * The referrer of the page where the event occurred.
     */
    referrer?: string
    /**
     * The path of the page where the event occurred.
     */
    path?: string
    /**
     * The search query of the page where the event occurred.
     */
    search?: string
  }
}
