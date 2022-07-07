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
   * HTTP headers to send with each request.
   */
  headers?: {
    [k: string]: unknown
  }
  /**
   * Time in milliseconds when a request should be aborted. Default is 10000
   */
  timeout?: number
  /**
   * Payload to deliver to webhook URL (JSON-encoded).
   */
  data?: {
    [k: string]: unknown
  }
}
