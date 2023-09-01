// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pendo API Key
   */
  apiKey: string
  /**
   * Segment can set the Pendo Account ID upon page load. This can be overridden via the Account ID field in the Send Identify/Group Actions
   */
  accountId?: string
  /**
   * The Pendo Region you'd like to send data to
   */
  region: string
  /**
   * Segment can set the Pendo Visitor ID upon page load to either the Segment userId or anonymousId. This can be overridden via the Visitor ID field in the Send Identify/Group Actions
   */
  setVisitorIdOnLoad: string
}
