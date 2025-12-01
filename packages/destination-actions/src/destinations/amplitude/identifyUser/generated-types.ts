// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Utility field used to detect if Autocapture Attribution Plugin is enabled.
   */
  autocaptureAttributionEnabled?: boolean
  /**
   * Utility field used to detect if any attribution values need to be set.
   */
  autocaptureAttributionSet?: {
    [k: string]: unknown
  }
  /**
   * Utility field used to detect if any attribution values need to be set_once.
   */
  autocaptureAttributionSetOnce?: {
    [k: string]: unknown
  }
  /**
   * Utility field used to detect if any attribution values need to be unset.
   */
  autocaptureAttributionUnset?: {
    [k: string]: unknown
  }
  /**
   * A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.
   */
  user_id?: string | null
  /**
   * A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.
   */
  device_id?: string
  /**
   * Additional data tied to the user in Amplitude. Each distinct value will show up as a user segment on the Amplitude dashboard. Object depth may not exceed 40 layers. **Note:** You can store property values in an array and date values are transformed into string values.
   */
  user_properties?: {
    [k: string]: unknown
  }
  /**
   * Groups of users for Amplitude's account-level reporting feature. Note: You can only track up to 5 groups. Any groups past that threshold will not be tracked. **Note:** This feature is only available to Amplitude Enterprise customers who have purchased the Amplitude Accounts add-on.
   */
  groups?: {
    [k: string]: unknown
  }
  /**
   * The current version of your application.
   */
  app_version?: string
  /**
   * Platform of the device. If using analytics.js to send events from a Browser and no if no Platform value is provided, the value "Web" will be sent.
   */
  platform?: string
  /**
   * The name of the mobile operating system or browser that the user is using.
   */
  os_name?: string
  /**
   * The version of the mobile operating system or browser the user is using.
   */
  os_version?: string
  /**
   * The device brand that the user is using.
   */
  device_brand?: string
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
   * The current Designated Market Area of the user.
   */
  dma?: string
  /**
   * The language set by the user.
   */
  language?: string
  /**
   * Whether the user is paying or not.
   */
  paying?: boolean
  /**
   * The version of the app the user was first on.
   */
  start_version?: string
  /**
   * Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.
   */
  insert_id?: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * Enabling this setting will set the Device manufacturer, Device Model and OS Name properties based on the user agent string provided in the userAgent field
   */
  userAgentParsing?: boolean
  /**
   * Enabling this setting will send user_agent based on the raw user agent string provided in the userAgent field
   */
  includeRawUserAgent?: boolean
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
   * The referrer of the web request. Sent to Amplitude as both last touch “referrer” and first touch “initial_referrer”
   */
  referrer?: string
  /**
   * Amplitude has a default minimum id length of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.
   */
  min_id_length?: number | null
  /**
   * The name of the library that generated the event.
   */
  library?: string
  /**
   * The user agent data of device sending the event
   */
  userAgentData?: {
    model?: string
    platformVersion?: string
  }
}
