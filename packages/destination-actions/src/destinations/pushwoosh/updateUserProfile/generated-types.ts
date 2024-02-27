// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * The user's email
   */
  email?: string | null
  /**
   * Version of the app
   */
  app_version?: string | null
  /**
   * Device ID
   */
  device_id?: string | null
  /**
   * Device Model
   */
  device_model?: string | null
  /**
   * Device Platform
   */
  device_platform?: string | null
  /**
   * Device Token. This is not automatically collected by Segment Mobile SDKs. Add it into the Segment payload if needed
   */
  device_token?: string | null
  /**
   * Language
   */
  language?: string | null
  /**
   * The country code of the user
   */
  country?: string | null
  /**
   * The city of the user
   */
  city?: string | null
  /**
   * The user's current longitude/latitude.
   */
  current_location?: {
    latitude?: number
    longitude?: number
  }
  /**
   * The version of the device OS
   */
  device_os_version?: string | null
  /**
   * The timezone of the user
   */
  timezone?: string | null
  /**
   * User agent of the device
   */
  user_agent?: string | null
  /**
   * Custom attributes to send to Pushwoosh
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
