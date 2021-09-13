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
   * Payload to deliver to webhook URL (JSON-encoded).
   */
  data?: {
    [k: string]: unknown
  }
}
