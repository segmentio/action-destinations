// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Pendo Visitor ID. Maps to Segment userId
   */
  visitorId: string
  /**
   * Pendo Account ID. Maps to Segment groupId.  Note: If you plan to change this, enable the setting "Use custom Segment group trait for Pendo account id"
   */
  accountId: string
  /**
   * Additional Account data to send
   */
  accountData?: {
    [k: string]: unknown
  }
  /**
   * Additional Parent Account data to send. Note: Contact Pendo to request enablement of Parent Account feature.
   */
  parentAccountData?: {
    id: string
    [k: string]: unknown
  }
}
