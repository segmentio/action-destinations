// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the user in your database. A userId or an anonymousId is required.
   */
  user_id?: string
  /**
   * A pseudo-unique substitute for a User ID, for cases when you don’t have an absolutely unique identifier. A userId or an anonymousId is required.
   */
  anonymous_id?: string
  /**
   * Timestamp when the message itself took place as a ISO-8601 format date string. Defaults to current time if not provided.
   */
  timestamp?: string
  /**
   * Name of the action that a user has performed.
   */
  event_name?: string
  /**
   * Dictionary of information about the current application.
   */
  application?: {
    /**
     * The app name.
     */
    name?: string
    /**
     * The app version.
     */
    version?: string
    /**
     * The app build.
     */
    build?: string
    /**
     * The app namespace.
     */
    namespace?: string
  }
  /**
   * Dictionary of information about the campaign that resulted in the API call. This maps directly to the common UTM campaign parameters.
   */
  campaign_parameters?: {
    /**
     * The campaign name.
     */
    name?: string
    /**
     * The campaign source.
     */
    source?: string
    /**
     * The campaign medium.
     */
    medium?: string
    /**
     * The campaign term.
     */
    term?: string
    /**
     * The campaign content.
     */
    content?: string
  }
  /**
   * Dictionary of information about the device the API call originated from.
   */
  device?: {
    /**
     * The device ID.
     */
    id?: string
    /**
     * The device Advertising ID.
     */
    advertising_id?: string
    /**
     * Whether or not ad tracking is enabled.
     */
    adTracking_Enabled?: boolean
    /**
     * The device manufacturer.
     */
    manufacturer?: string
    /**
     * The device model.
     */
    model?: string
    /**
     * The device name.
     */
    name?: string
    /**
     * The device type.
     */
    type?: string
    /**
     * The device token.
     */
    token?: string
  }
  /**
   * The current user’s IP address.
   */
  ip_address?: string
  /**
   * Locale string for the current user, for example en-US.
   */
  locale?: string
  /**
   * Dictionary of information about the user’s current location.
   */
  location?: {
    /**
     * The user's city
     */
    city?: string
    /**
     * The user's country
     */
    country?: string
    /**
     * The user's latitude
     */
    latitude?: number
    /**
     * The user's longitude
     */
    longitude?: number
    /**
     * The user's speed
     */
    speed?: number
  }
  /**
   * Dictionary of information about the current network connection.
   */
  network?: {
    /**
     * Whether or not bluetooth is enabled.
     */
    bluetooth?: boolean
    /**
     * The network carrier.
     */
    carrier?: string
    /**
     * Whether or not cellular data is enabled.
     */
    cellular?: boolean
    /**
     * Whether or not WiFi is enabled.
     */
    wifi?: boolean
  }
  /**
   * Dictionary of information about the operating system.
   */
  operating_system?: {
    /**
     * The operating system name.
     */
    name?: string
    /**
     * The operating system version.
     */
    version?: string
  }
  /**
   * Dictionary of information about the current page in the browser.
   */
  page?: {
    /**
     * The page path.
     */
    path?: string
    /**
     * The page referrer.
     */
    referrer?: string
    /**
     * The page search query.
     */
    search?: string
    /**
     * The page title.
     */
    title?: string
    /**
     * The page URL.
     */
    url?: string
  }
  /**
   * Dictionary of information about the device’s screen.
   */
  screen?: {
    /**
     * The screen density.
     */
    density?: number
    /**
     * The screen height.
     */
    height?: number
    /**
     * The screen width.
     */
    width?: number
  }
  /**
   * User agent of the device the API call originated from.
   */
  user_agent?: string
  /**
   * The user’s timezone as a tz database string, for example America/New_York.
   */
  timezone?: string
  /**
   * The group or account ID a user is associated with.
   */
  group_id?: string
  /**
   * Free-form dictionary of properties that describe the screen.
   */
  properties?: {
    [k: string]: unknown
  }
}
