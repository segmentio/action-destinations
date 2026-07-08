// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The action/event type that was performed.
   */
  a: string
  /**
   * Unique event ID. Must be unique for each event. UUID format is recommended. Defaults to the Segment messageId.
   */
  eid: string
  /**
   * Timestamp of the event, in ISO 8601 format or UNIX milliseconds. Must be within the last 7 days. Sent to Vibe as UNIX milliseconds.
   */
  ts?: string | number
  /**
   * IP address of the user who performed the action. Must be IPv4. Required if Email is not provided.
   */
  ip?: string
  /**
   * User email address. Required if IP Address is not provided.
   */
  em?: string
  /**
   * Additional data to be sent with the event.
   */
  ed?: {
    /**
     * A unique identifier for the purchase.
     */
    purchase_id?: string
    /**
     * The price of the conversion in USD.
     */
    price_usd?: number
    [k: string]: unknown
  }
  /**
   * Google Analytics ID for cross-platform attribution.
   */
  gid?: string
  /**
   * User Agent string.
   */
  ua?: string
  /**
   * The URL of the page where the action occurred.
   */
  url?: string
}
