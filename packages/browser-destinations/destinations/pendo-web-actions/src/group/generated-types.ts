// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Pendo Visitor ID. Defaults to Segment userId
   */
  visitorId: string
  /**
   * Pendo Account ID. This overrides the Pendo Account ID setting
   */
  accountId: string
  /**
   * Additional Account data to send
   */
  accountData?: {
    [k: string]: unknown
  }
}
