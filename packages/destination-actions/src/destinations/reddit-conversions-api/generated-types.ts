// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Unique identifier of an ad account. This can be found in the Reddit UI.
   */
  ad_account_id: string
  /**
   * The conversion token for your Reddit account. This can be found by following the steps mentioned [here](https://business.reddithelp.com/helpcenter/s/article/conversion-access-token).
   */
  conversion_token: string
  /**
   * Indicates if events should be treated as test events by Reddit. Only applies to Reddit Conversions API V2. V3 (Beta) is the latest API version. To send test events on V3, set the Test ID setting instead.
   */
  test_mode?: boolean
  /**
   * A test ID from Reddit Event Testing. When set, events are routed to Event Testing for verification instead of production. Remove before sending production traffic. Only applies to Reddit Conversions API V3 (Beta).
   */
  test_id?: string
}
