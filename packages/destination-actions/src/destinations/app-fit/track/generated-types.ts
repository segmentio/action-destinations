// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  userId?: string
  /**
   * When the event occurred.
   */
  occurredAt: string | number
  /**
   * The event name
   */
  name: string
  /**
   * The anonymous ID of the user
   */
  anonymousId?: string
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The app version
   */
  appVersion?: string
  /**
   * The device ID of the user
   */
  deviceId?: string
  /**
   * The device type
   */
  deviceType?: string
  /**
   * The device manufacturer
   */
  deviceManufacturer?: string
  /**
   * The device model
   */
  deviceModel?: string
  /**
   * The device advertising ID
   */
  deviceAdvertisingId?: string
  /**
   * The IP address of the client
   */
  ipAddress?: string
  /**
   * The name of the operating system
   */
  osName?: string
  /**
   * The version of the operating system
   */
  osVersion?: string
  /**
   * The event ID
   */
  eventId: string
}
