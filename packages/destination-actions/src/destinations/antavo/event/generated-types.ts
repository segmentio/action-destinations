// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID, selected in Antavo as customer identifier
   */
  customer: string
  /**
   * Loyalty event name in Antavo
   */
  action: string
  /**
   * Antavo Account ID — if the Multi Accounts extension is enabled
   */
  account?: string
  /**
   * Event data
   */
  data?: {
    [k: string]: unknown
  }
}
