// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Movable Ink URL to send data to. This field overrides the "Movable Ink URL" setting.
   */
  movable_ink_url?: string
  /**
   * HTTP method to use.
   */
  method: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * HTTP headers to send with each request. Only ASCII characters are supported.
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * Payload to deliver to webhook URL (JSON-encoded).
   */
  data?: {
    [k: string]: unknown
  }
}
