// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * When enabled, the action will use the RoadwayAI batch API.
   */
  enable_batching?: boolean
  /**
   * The name of the action being performed.
   */
  event: string
  /**
   * A distinct ID specified by you.
   */
  distinct_id?: string
  /**
   * A distinct ID randomly generated prior to calling identify.
   */
  anonymous_id?: string
  /**
   * The distinct ID after calling identify.
   */
  user_id?: string
  /**
   * The unique identifier of the group that performed this event.
   */
  group_id?: string
  /**
   * A random id that is unique to an event.
   */
  insert_id?: string
  /**
   * The timestamp of the event.
   */
  timestamp?: string | number
  /**
   * The name of your application.
   */
  app_name?: string
  /**
   * The namespace of your application.
   */
  app_namespace?: string
  /**
   * The current build of your application.
   */
  app_build?: string
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
   * The type of the user's device.
   */
  device_type?: string
  /**
   * The name of the user's device.
   */
  device_name?: string
  /**
   * The device manufacturer that the user is using.
   */
  device_manufacturer?: string
  /**
   * The device model that the user is using.
   */
  device_model?: string
  /**
   * The current country of the user.
   */
  country?: string
  /**
   * The current region of the user.
   */
  region?: string
  /**
   * The language set by the user.
   */
  language?: string
  /**
   * The full URL of the webpage on which the event is triggered.
   */
  url?: string
  /**
   * Width, in pixels, of the device screen.
   */
  screen_width?: number
  /**
   * Height, in pixels, of the device screen.
   */
  screen_height?: number
  /**
   * Pixel density of the device screen.
   */
  screen_density?: number
  /**
   * Referrer url
   */
  referrer?: string
  /**
   * User agent
   */
  userAgent?: string
  /**
   * The event timezone
   */
  timezone?: string
  /**
   * The App Platform, if applicable
   */
  app_platform?: string
  /**
   * The Event Original Name, if applicable
   */
  name?: string
  /**
   * An object of key-value pairs that represent additional data to be sent along with the event.
   */
  event_properties?: {
    [k: string]: unknown
  }
  /**
   * An object of key-value pairs that provides useful context about the event.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * UTM Tracking Properties
   */
  utm_properties?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
