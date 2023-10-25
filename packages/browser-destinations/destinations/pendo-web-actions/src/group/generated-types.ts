// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Pendo Visitor ID. Maps to Segment userId
   */
  visitorId: string
  /**
   * Pendo Account ID
   */
  accountId: string
  /**
   * Additional Account data to send
   */
  accountData?: {
    [k: string]: unknown
  }
}
