// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * URL to deliver data to.
   */
  url: string
  /**
   * HTTP method to use.
   */
  method: string
  /**
   * The target number of events to batch together in a single request, max size 4000.
   */
  batch_size?: number
  /**
   * HTTP headers to send with each request.
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
