// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A type of your event, e.g. a sign up or a name of an action within your product.
   */
  event: string
  /**
   * The timestamp of the event. Could be any date string/number value compatible with JavaScript Date constructor: e.g. milliseconds epoch or an ISO datetime. If time is not sent with the event, it will be set to the request time.
   */
  time?: string | number
  /**
   * A distinct ID of an unidentified (logged out) user. Device id is used if available
   */
  anonymous_id?: string
  /**
   * A distinct ID of an identified (logged in) user.
   */
  user_id?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  group_id?: string
  /**
   * A random id that is unique to an event. ID is being used to prevent event duplication. All the events that share the same unique id besides the first one will be ignored.
   */
  event_unique_id?: string
  /**
   * The current version of your application.
   */
  app_version?: string
  /**
   * The name of the mobile operating system or browser that the user is using.
   */
  os_name?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  os_version?: string
  /**
   * A unique identifier for the device the user is using.
   */
  device_id?: string
  /**
   * Platform of the device.
   */
  platform?: string
  /**
   * The device manufacturer that the user is using.
   */
  device_manufacturer?: string
  /**
   * The device model that the user is using.
   */
  device_model?: string
  /**
   * The carrier that the user is using.
   */
  carrier?: string
  /**
   * Whether cellular is enabled.
   */
  cellular?: boolean
  /**
   * The current country of the user.
   */
  country?: string
  /**
   * The current region of the user.
   */
  region?: string
  /**
   * The current city of the user.
   */
  city?: string
  /**
   * The language set by the user.
   */
  language?: string
  /**
   * The name of the SDK used to send events.
   */
  library_name?: string
  /**
   * The version of the SDK used to send events.
   */
  library_version?: string
  /**
   * The IP address of the user. This is only used for geolocation and won't be stored.
   */
  ip?: string
  /**
   * The full URL of the webpage on which the event is triggered.
   */
  url?: string
  /**
   * The relative URL of the webpage on which the event is triggered.
   */
  path?: string
  /**
   * The name of the webpage on which the event is triggered.
   */
  page_title?: string
  /**
   * Referrer url
   */
  referrer?: string
  /**
   * User agent
   */
  user_agent?: string
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  event_properties?: {
    [k: string]: unknown
  }
}
