// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The URL of the page
   */
  url: string
  /**
   * VWO UUID
   */
  vwoUuid: string
  /**
   * Page Context
   */
  page: {
    [k: string]: unknown
  }
  /**
   * IP Address
   */
  ip?: string
  /**
   * User Agent
   */
  userAgent: string
  /**
   * Timestamp
   */
  timestamp: string
}
