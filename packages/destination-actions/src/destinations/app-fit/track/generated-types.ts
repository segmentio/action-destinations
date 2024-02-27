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
   * The device ID of the user
   */
  deviceId?: string
  /**
   * The device type
   */
  deviceType?: string
  /**
   * The name of the operating system
   */
  osName?: string
  /**
   * The event ID
   */
  eventId: string
}
