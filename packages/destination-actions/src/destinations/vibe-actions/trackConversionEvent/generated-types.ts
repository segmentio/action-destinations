// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Distinct event identifier (UUID recommended). Defaults to the Segment message ID. A UUID is generated automatically if left empty.
   */
  eventId?: string
  /**
   * The conversion action category performed.
   */
  action: string
  /**
   * Event timestamp. Converted to UNIX epoch milliseconds before sending.
   */
  timestamp: string | number
  /**
   * The user's IP address.
   */
  ipAddress?: string
  /**
   * The purchase price in USD. Included in the event data payload.
   */
  priceUsd?: number
  /**
   * The purchase or order identifier. Included in the event data payload.
   */
  purchaseId?: string
  /**
   * Google Analytics identifier used for attribution.
   */
  googleAnalyticsId?: string
  /**
   * The browser/device user agent string.
   */
  userAgent?: string
  /**
   * The URL of the page where the action occurred.
   */
  url?: string
}
