// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The AppsFlyer device identifier. If omitted, the advertising ID is used, then the User ID, then the Anonymous ID.
   */
  appsflyer_id?: string
  /**
   * The device platform. Must be `ios`, `android` or `roku`.
   */
  device_type: string
  /**
   * The name of the event.
   */
  event_name: string
  /**
   * Properties of the event. Serialized to a JSON string with all values quoted, as AppsFlyer requires. A `revenue` property is sent as `af_revenue`.
   */
  event_value?: {
    [k: string]: unknown
  }
  /**
   * The currency of any revenue value, as an ISO 4217 code. Defaults to USD.
   */
  event_currency?: string
  /**
   * When the event occurred.
   */
  event_time?: string | number
  /**
   * Your own identifier for the user.
   */
  uid?: string
  /**
   * The Segment anonymous ID, used as a fallback identifier.
   */
  anonymous_id?: string
  /**
   * The device OS version. Required by AppsFlyer for iOS in-app events.
   */
  os_version?: string
  /**
   * The device IP address.
   */
  ip?: string
  /**
   * The device advertising ID. Sent as `idfa` on iOS and `advertising_id` on Android and Roku.
   */
  advertising_id?: string
  /**
   * The iOS vendor identifier, used when the advertising ID is unavailable or zeroed out.
   */
  device_id?: string
  /**
   * The app bundle identifier. Sent for iOS only.
   */
  bundle_id?: string
  /**
   * The iOS App Tracking Transparency status. Sent for iOS only.
   */
  att?: number
  /**
   * The historical number of times the app has been opened by this user.
   */
  counter?: number
  /**
   * The Google Play store referrer. Sent for Android and Roku only.
   */
  referrer?: string
  /**
   * Consent information to forward to AppsFlyer.
   */
  consent_data?: {
    [k: string]: unknown
  }
}
