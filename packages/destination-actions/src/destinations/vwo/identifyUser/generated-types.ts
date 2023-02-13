// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Visitor's attributes to be mapped
   */
  attributes: {
    [k: string]: unknown
  }
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
