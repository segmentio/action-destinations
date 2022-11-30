// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A JSON object containing additional attributes that will be associated with the event.
   */
  attributes: {
    [k: string]: unknown
  }
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
