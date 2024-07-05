// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The app token for your Adjust account. Overrides the Default App Token from Settings.
   */
  app_token?: string
  /**
   * The event token. Overrides the Default Event Token from Settings.
   */
  event_token?: string
  /**
   * The unique device identifier
   */
  device_id: string
  /**
   * The advertising identifier ("idfa" for iOS, "gps_adid" for Android).
   */
  advertising_id: string
  /**
   * The device type. Options: "ios" or "android".
   */
  device_type: string
  /**
   * The name of the library. Suggestions: "analytics-ios" or "analytics-android".
   */
  library_name?: string
  /**
   * The revenue amount.
   */
  revenue?: number
  /**
   * The currency of the revenue. Only set if revenue is also set.
   */
  currency?: string
}
