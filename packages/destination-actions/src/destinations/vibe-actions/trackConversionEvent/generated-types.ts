// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Distinct event identifier (UUID recommended). Defaults to the Segment message ID. A UUID is generated automatically if left empty.
   */
  eventId?: string
  /**
   * The conversion action category performed. No default is applied; set explicitly or via a preset.
   */
  action: string
  /**
   * Event timestamp. Converted to UNIX epoch milliseconds before sending. Must be within the last 7 days.
   */
  timestamp: string | number
  /**
   * The user's email address. Required if IP Address is not provided.
   */
  email?: string
  /**
   * The user's IP address (IPv4). Required if Email is not provided.
   */
  ipAddress?: string
  /**
   * Additional event data sent as a stringified JSON object. Reserved keys `price_usd` (float) and `purchase_id` (string) can be set here or via their dedicated fields.
   */
  eventData?: {
    [k: string]: unknown
  }
  /**
   * The purchase price in USD. Merged into the event data payload as `price_usd`.
   */
  priceUsd?: number
  /**
   * The purchase or order identifier. Merged into the event data payload as `purchase_id`.
   */
  purchaseId?: string
  /**
   * Google Analytics identifier used for cross-platform attribution.
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
