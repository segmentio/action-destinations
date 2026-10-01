// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event (e.g. `page`, `add_to_cart`, `purchase`). Defaults to the track event name, or the call type (`page`) for page calls.
   */
  event: string
  /**
   * When the event occurred. Sent as RFC 3339 UTC. The Web Events API rejects events dated more than 14 days in the past or 30 minutes in the future.
   */
  timestamp: string | number
  /**
   * Identifier used to group events from the same browsing session. Defaults to `anonymousId` (a device identifier).
   */
  session_id: string
  /**
   * The identifier for the logged-in user, if known.
   */
  user_id?: string
  /**
   * Deduplication key. Defaults to the Segment `messageId`.
   */
  distinct_id?: string
  /**
   * IPv4 or IPv6 address of the end user. Required by Tatari. Server-side sources often lack a real user IP — map it explicitly if so.
   */
  ip_address: string
  /**
   * Browser user agent string of the end user.
   */
  user_agent: string
  /**
   * Full URL (`http://` or `https://`) of the page the event occurred on. Include UTM parameters if available.
   */
  url: string
  /**
   * URL of the referring page, if any.
   */
  referrer_url?: string
  /**
   * Email address of the user. Normalized (trimmed, lowercased) and hashed with SHA-256, SHA-1 and MD5 before sending. A value that is already a hex digest is passed through unchanged.
   */
  email?: string
  /**
   * Order identifier for purchase events. Sent as `args.order_id` (always a string).
   */
  order_id?: string
  /**
   * Order value for purchase events, used for ROAS. Sent as `args.order_total` (a number). Defaults to `properties.total`, falling back to `properties.revenue`.
   */
  order_total?: number
  /**
   * Arbitrary JSON object of event properties, forwarded as `args`. `order_id` and `order_total` above take precedence over keys of the same name here. An `email` key is dropped; use the Email field so it is hashed. Avoid sending other PII here.
   */
  args?: {
    [k: string]: unknown
  }
  /**
   * When enabled, events are sent to the Tatari batch endpoint in groups instead of one request per event.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events per batch request. Tatari accepts at most 1000. Actual batch sizes may be smaller.
   */
  batch_size?: number
  /**
   * Maximum size of a batch request in bytes. The Tatari batch endpoint rejects requests over 3 MB.
   */
  batch_bytes?: number
}
