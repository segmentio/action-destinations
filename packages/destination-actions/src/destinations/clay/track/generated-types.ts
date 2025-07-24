// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event
   */
  event: string
  /**
   * The type of the event. Either "page" or "track"
   */
  type: string
  /**
   * The timestamp of the track event
   */
  timestamp?: string
  /**
   * Information about the current page
   */
  page?: {
    /**
     * Path of the webpage
     */
    path?: string
    /**
     * Referrer of the webpage
     */
    referrer?: string
    /**
     * Search query of the webpage
     */
    search?: string
    /**
     * Title of the webpage
     */
    title?: string
    /**
     * Full URL of the webpage
     */
    url?: string
  }
  /**
   * IP address of the user
   */
  ip: string
  /**
   * User-Agent of the user
   */
  userAgent?: string
  /**
   * The anonymous ID associated with the user
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The Segment messageId
   */
  messageId: string
  /**
   * Properties to associate with the event
   */
  properties?: {
    [k: string]: unknown
  }
}
