// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Custom properties to send with the pageview. Please note that URL, title, refererrer, path and search are automatically collected and don't have to be mapped here.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Any default or custom field of the user. On the left-hand side, input the API name of the field as seen in your Encharge account. On the right-hand side, map the Segment field that contains the value. Any properties that don't exist will be created automatically. See more information in [Encharge's documentation](https://help.encharge.io/article/206-create-and-manage-custom-fields).
   */
  userFields?: {
    [k: string]: unknown
  }
  /**
   * The type of event.
   */
  type: string
  /**
   * The email address of the user.
   */
  email?: string
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
