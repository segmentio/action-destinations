// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment User ID
   */
  user_id: string
  /**
   * Segment Anonymous ID
   */
  anonymous_id?: string
  /**
   * Segment page name
   */
  name?: string
  /**
   * Segment event channel
   */
  channel?: string
  /**
   * Segment event sentAt
   */
  sentAt?: string | number
  /**
   * Segment event context
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Segment event properties
   */
  properties?: {
    [k: string]: unknown
  }
}
