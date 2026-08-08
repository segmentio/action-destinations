// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event
   */
  name: string
  /**
   * JSON object containing additional properties that will be associated with the event.
   */
  properties?: {
    [k: string]: unknown
  }
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
