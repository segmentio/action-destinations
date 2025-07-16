// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The timestamp of the page event
   */
  timestamp?: string
  /**
   * URL of the webpage
   */
  url?: string
  /**
   * Contains context information regarding a webpage
   */
  page?: {
    [k: string]: unknown
  }
  /**
   * IP address of the user
   */
  ip: string
  /**
   * User-Agent of the user
   */
  userAgent?: string
  /**
   * The anonymous ID associated with the user
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The Segment messageId
   */
  messageId: string
}
