// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the person that this mobile device belongs to.
   */
  person_id: string
  /**
   * The device token of a customer's mobile device.
   */
  device_id: string
  /**
   * The version of the App
   */
  app_version?: string
  /**
   * The mobile device's platform. ("ios" or "android")
   */
  platform: string
  /**
   * The timestamp for when the mobile device was last used. Default is current date and time.
   */
  last_used?: string
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
}
