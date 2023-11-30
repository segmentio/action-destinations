// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the user
   */
  userId?: string
  /**
   * Anonymous identifier for the user
   */
  anonymousId?: string
  /**
   * The Segment user traits to be forwarded to Screeb and set as attributes
   */
  properties?: {
    [k: string]: unknown
  }
}
