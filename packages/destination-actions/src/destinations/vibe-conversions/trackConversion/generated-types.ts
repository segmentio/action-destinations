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
   * Event data. Sent to Vibe as a stringified JSON object. The reserved attributes Price (USD) and Purchase ID are merged into this object.
   */
  ed?: {
    [k: string]: unknown
  }
  /**
   * Reserved event-data attribute: the price of the conversion in USD. Merged into Event Data as `price_usd`.
   */
  price_usd?: number
  /**
   * Reserved event-data attribute: a unique identifier for the purchase. Merged into Event Data as `purchase_id`.
   */
  purchase_id?: string
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
  /**
   * When enabled, Segment groups events before delivering them to this destination.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
