// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Pendo Visitor ID. Maps to Segment userId
   */
  visitorId: string
  /**
   * Additional Visitor data to send
   */
  visitorData?: {
    [k: string]: unknown
  }
  /**
   * Pendo Account ID. Maps to Segment groupId.  Note: If you plan to change this, enable the setting "Use custom Segment group trait for Pendo account id"
   */
  accountId?: string
}
