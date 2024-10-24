// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Timestamp for when the event happened.
   */
  timestamp?: string | number
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
   * The name of the Segment library used to trigger the event. E.g. "analytics-ios" or "analytics-android".
   */
  library_name?: string
  /**
   * The revenue amount of the event. E.g. 75.5 for $75.50. Currency can be set with the "Currency field".
   */
  revenue?: number
  /**
   * The revenue currency. Only set if revenue is also set. E.g. "USD" or "EUR".
   */
  currency?: string
}
