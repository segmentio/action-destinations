// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * URL of the webpage
   */
  url?: string
  /**
   * Wingify UUID
   */
  wingifyUuid: string
  /**
   * Contains context information regarding a webpage
   */
  page?: {
    [k: string]: unknown
  }
  /**
   * IP address of the user. Only useful when events originate from Segment client libraries (web/mobile); server-side events will contain Segment server IPs.
   */
  ip?: string
  /**
   * User-Agent of the user
   */
  userAgent?: string
  /**
   * Timestamp on the event
   */
  timestamp?: string
}
