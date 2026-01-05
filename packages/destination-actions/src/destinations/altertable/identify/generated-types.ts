// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Segment event type
   */
  type: string
  /**
   * The traits of the user
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The ID of the user
   */
  userId: string
  /**
   * The anonymous ID of the user
   */
  anonymousId?: string
  /**
   * The context properties to send with the event
   */
  context?: {
    /**
     * The IP address of the user
     */
    ip?: string
    /**
     * The URL of the page
     */
    url?: string
    /**
     * The referrer URL
     */
    referrer?: string
    /**
     * The name of the operating system
     */
    os?: string
    /**
     * The user agent string
     */
    user_agent?: string
    /**
     * The UTM campaign name
     */
    utm_campaign?: string
    /**
     * The UTM source
     */
    utm_source?: string
    /**
     * The UTM medium
     */
    utm_medium?: string
    /**
     * The UTM term
     */
    utm_term?: string
    /**
     * The UTM content
     */
    utm_content?: string
    /**
     * The width of the screen
     */
    screen_width?: number
    /**
     * The height of the screen
     */
    screen_height?: number
    /**
     * The name of the library sending the event
     */
    library_name?: string
    /**
     * The version of the library sending the event
     */
    library_version?: string
    /**
     * The device ID of the user
     */
    device_id?: string
  }
  /**
   * The timestamp of the event
   */
  timestamp: string | number
}
