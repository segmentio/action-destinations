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
