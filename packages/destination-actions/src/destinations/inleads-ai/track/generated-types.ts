// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event
   */
  eventName: string
  /**
   * The user id, to uniquely identify the user associated with the event
   */
  user_id: string
  /**
   * The account id, to uniquely identify the account associated with the user
   */
  account_id?: string
  /**
   * The properties of the track call
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The Traits of the track call
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User metadata including IP, Location, etc.
   */
  userMeta?: {
    /**
     * The user's IP address.
     */
    ip?: string
    /**
     * The latitude coordinate of the user's location.
     */
    latitude?: number
    /**
     * The longitude coordinate of the user's location.
     */
    longitude?: number
    /**
     * The country of the user's location.
     */
    country?: string
    /**
     * The city of the user's location.
     */
    city?: string
    /**
     * The user's web browser.
     */
    browser?: string
    /**
     * The user's operating system.
     */
    os?: string
    /**
     * The version of the user's operating system.
     */
    osVersion?: string
    /**
     * The type of device the user is using.
     */
    deviceType?: string
    /**
     * The vendor or manufacturer of the user's device.
     */
    deviceVendor?: string
    /**
     * The model of the user's device.
     */
    deviceModel?: string
    /**
     * The time zone of the user's location.
     */
    timeZone?: string
  }
  /**
   * User Anonymous id
   */
  anonymous_id?: string | null
  /**
   * The ID of the event.
   */
  event_id?: string
  /**
   * The URL of the page where the event occurred.
   */
  url?: string
  /**
   * The referrer of the page where the event occurred.
   */
  referer?: string
  /**
   * The language of the browser.
   */
  user_language?: string
  /**
   * The time of the event in UTC.
   */
  utc_time: string
  /**
   * Information about the UTM parameters.
   */
  utm?: {
    /**
     * The source of the campaign.
     */
    source?: string
    /**
     * The medium of the campaign.
     */
    medium?: string
    /**
     * The name of the campaign.
     */
    name?: string
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
   * Information about the screen.
   */
  screen?: {
    /**
     * The height of the screen.
     */
    height?: number
    /**
     * The width of the screen.
     */
    width?: number
    /**
     * The density of the screen.
     */
    density?: number
  }
  /**
   * The timezone of the browser.
   */
  timezone?: string
  /**
   * The IP address of the user.
   */
  source_ip?: string
}
