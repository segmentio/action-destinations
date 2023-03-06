// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Email Field
   */
  email?: string
  /**
   * Event Type
   */
  type?: string
  /**
   * Timestamp
   */
  timestamp?: string | number
  /**
   * Context Section
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Properties Section
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Traits Section
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * Enable batching of Segment Events through to Acoustic Tables
   */
  enable_batching?: boolean
}
