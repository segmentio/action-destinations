// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID associated with the user
   */
  userId?: string | null
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The page referrer
   */
  referrer?: string | null
  /**
   * The page URL
   */
  url?: string | null
  /**
   * The if of the device sending the event.
   */
  ip?: string
  /**
   * The user agent of the device sending the event.
   */
  userAgent?: string
  /**
   * The event name
   */
  event: string
  /**
   * Properties to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
}
