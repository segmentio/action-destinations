// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Property key by which Cordial contact should be identified. May be any primary or secondary key (e.g. cID, email, segment_id etc.)
   */
  identifyByKey: string
  /**
   * Value for defined key
   */
  identifyByValue: string
  /**
   * Segment event name
   */
  action: string
  /**
   * Segment event sentAt
   */
  time?: string | number
  /**
   * Segment event properties
   */
  properties?: {
    [k: string]: unknown
  }
}
