// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The AppsFlyer device identifier. If omitted, the advertising ID is used.
   */
  appsflyer_id?: string
  /**
   * The device platform. Must be `ios`, `android` or `roku`.
   */
  device_type: string
  /**
   * When the event occurred. Required — this value is part of the request signature.
   */
  timestamp: string | number
  /**
   * The device IP address. Required — this value is part of the request signature.
   */
  ip: string
  /**
   * The device locale. Required — this value is part of the request signature.
   */
  locale: string
  /**
   * The device advertising ID. Sent as `idfa` on iOS and `advertising_id` on Android and Roku.
   */
  advertising_id?: string
  /**
   * The iOS vendor identifier, used when the advertising ID is unavailable or zeroed out.
   */
  device_id?: string
  /**
   * Whether the user has allowed ad tracking. Sent to AppsFlyer as the `aie` flag.
   */
  ad_tracking_enabled?: boolean
  /**
   * The device user agent.
   */
  user_agent?: string
  /**
   * The device OS version.
   */
  os_version?: string
  /**
   * The device model, sent to AppsFlyer as `type`.
   */
  device_model?: string
  /**
   * The app bundle identifier. Sent for iOS only.
   */
  bundle_id?: string
  /**
   * The iOS App Tracking Transparency status. Sent for iOS only.
   */
  att?: number
  /**
   * Your own identifier for the user.
   */
  uid?: string
  /**
   * The Segment anonymous ID, used as a fallback identifier.
   */
  anonymous_id?: string
  /**
   * Campaign attribution, mapped to AppsFlyer's Apple Search Ads fields. Sent for iOS only.
   */
  campaign?: {
    [k: string]: unknown
  }
  /**
   * The Facebook cookie associated with this user.
   */
  fb_cookie?: string
  /**
   * Your customer user ID. AppsFlyer prefers this over the User ID when both are present.
   */
  cid?: string
  /**
   * When this user originally installed the app. Segment cannot derive this, so it must be supplied on the event.
   */
  install_date: string | number
  /**
   * The historical number of times this user has opened the app. Segment does not track this, so it must be supplied on the event.
   */
  counter: number
  /**
   * The full deeplink URL that opened the app.
   */
  deeplink?: string
  /**
   * The Google Play store referrer URL. Sent for Android and Roku only.
   */
  referrer?: string
}
