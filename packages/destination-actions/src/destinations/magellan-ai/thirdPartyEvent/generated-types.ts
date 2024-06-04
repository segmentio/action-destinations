// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the custom third-party event to pass to Magellan AI
   */
  evtname: string
  /**
   * An arbitrary JSON object containing any additional data about this event
   */
  evtattrs?: {
    [k: string]: unknown
  }
  /**
   * The name of the MMP platform transmitting this event to Segment (e.g., Appsflyer, Singular, etc.)
   */
  host: string
  /**
   * The name of the mobile application
   */
  app: string
  /**
   * The IPv4 address of the end user who installed the app (Note: Segment does not support collecting IPv6 addresses)
   */
  ip: string
  /**
   * The user agent of the end user who installed the app (Note: not sent by the iOS Segment agent)
   */
  ua: string
  /**
   * When the event occurred, in ISO 8601 format
   */
  ts: string
  /**
   * The mobile platform of the device (e.g., iOS, Android)
   */
  plat: string
  /**
   * The Google Advertising ID, on Android devices
   */
  aifa?: string
  /**
   * The Android ID, on Android devices
   */
  andi?: string
  /**
   * The ID for Advertising, on iOS devices
   */
  idfa?: string
  /**
   * The ID for Vendors, on iOS devices
   */
  idfv?: string
}
