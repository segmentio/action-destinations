// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * URL of the webpage
   */
  url: string
  /**
   * VWO UUID
   */
  vwoUuid: string
  /**
   * Contains context information regarding a webpage
   */
  page: {
    [k: string]: unknown
  }
  /**
   * IP address of the user
   */
  ip?: string
  /**
   * User-Agent of the user
   */
  userAgent: string
  /**
   * Timestamp on the event
   */
  timestamp: string
}
