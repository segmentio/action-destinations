// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Fields to associate with the user in Encharge. Any unexisting fields will be automatically created in Encharge.
   */
  user?: {
    [k: string]: unknown
  }
  /**
   * The email address of the user.
   */
  email?: string
  /**
   * The type of event.
   */
  type: string
  /**
   * An anonymous identifier for this user.
   */
  segmentAnonymousId?: string
  /**
   * The User ID associated with the user in Encharge.
   */
  userId?: string
  /**
   * An ID associating the event with a group.
   */
  groupId?: string
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The Segment messageId
   */
  messageId?: string
  /**
   * The IP address of the user.
   */
  ip?: string
  /**
   * The user agent of the user. Used to determine the device, browser and operating system.
   */
  userAgent?: string
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
  /**
   * Information about the location of the user.
   */
  location?: {
    /**
     * The city of the user.
     */
    city?: string
    /**
     * The region of the user.
     */
    region?: string
    /**
     * The country of the user.
     */
    country?: string
  }
}
