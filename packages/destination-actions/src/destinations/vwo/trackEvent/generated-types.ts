// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  name: string
  /**
   * A JSON object containing additional properties that will be associated with the event.
   */
  properties?: {
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
