// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Pendo Visitor ID. Defaults to Segment userId
   */
  visitorId: string
  /**
   * Additional Visitor data to send
   */
  visitorData?: {
    [k: string]: unknown
  }
  /**
   * Pendo Account ID. This overrides the Pendo Account ID setting
   */
  accountId?: string
  /**
   * Additional Account data to send
   */
  accountData?: {
    [k: string]: unknown
  }
  /**
   * Pendo Parent Account ID. This overrides the Pendo Parent Account ID setting. Note: Contact Pendo to request enablement of Parent Account feature.
   */
  parentAccountId?: string
  /**
   * Additional Parent Account data to send. Note: Contact Pendo to request enablement of Parent Account feature.
   */
  parentAccountData?: {
    [k: string]: unknown
  }
}
