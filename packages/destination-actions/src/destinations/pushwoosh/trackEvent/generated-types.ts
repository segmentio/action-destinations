// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id: string
  /**
   * Device ID
   */
  device_id?: string | null
  /**
   * Device Platform
   */
  device_platform?: string | null
  /**
   * Event Name
   */
  name: string
  /**
   * When the event occurred.
   */
  timestamp: string | number
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If true, Segment will batch events before sending to Pushwoosh. 100 events per request max.
   */
  enable_batching?: boolean
}
