// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Kochava App GUID. Overrides the Kochava App ID configured in Settings for this event.
   */
  kochava_app_id?: string
  /**
   * A consistent, unique device identifier. May be omitted when Device IDs are provided.
   */
  kochava_device_id?: string
  /**
   * iOS advertising identifier (IDFA). At least one device identifier is required.
   */
  idfa?: string
  /**
   * iOS vendor identifier (IDFV). At least one device identifier is required.
   */
  idfv?: string
  /**
   * Android/Google advertising identifier (ADID). At least one device identifier is required.
   */
  adid?: string
  /**
   * Android device identifier. At least one device identifier is required.
   */
  android_id?: string
  /**
   * The device user agent string. Either this or Device OS Version is required for OS detection.
   */
  device_ua?: string
  /**
   * The device OS version. Either this or Device User Agent is required for OS detection.
   */
  device_ver?: string
  /**
   * The IP address of the device.
   */
  origination_ip?: string
  /**
   * The version of the application.
   */
  app_version?: string
  /**
   * The time the event occurred. Sent to Kochava as epoch seconds.
   */
  usertime?: string | number
  /**
   * iOS 14+ App Tracking Transparency authorization status.
   */
  att?: boolean
  /**
   * iOS 14+ App Tracking Transparency prompt time (epoch seconds).
   */
  att_time?: number
  /**
   * iOS 14+ App Tracking Transparency prompt duration in seconds.
   */
  att_duration?: number
  /**
   * iOS 14+ App Tracking Transparency additional detail.
   */
  att_detail?: string
  /**
   * iOS 14+ Apple AdServices attribution token.
   */
  ad_services_token?: string
}
