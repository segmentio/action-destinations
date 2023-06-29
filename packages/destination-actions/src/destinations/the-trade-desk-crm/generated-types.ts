// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your long-lived Trade Desk authentication token. Please see The Trade Desk’s [authentication documentation](https://api.thetradedesk.com/v3/portal/api/doc/Authentication) for information on how to generate a long-lived API Token via the Manage API Tokens in the developer Portal.
   */
  auth_token: string
  /**
   * The platform ID of the advertiser for which to retrieve the status of the specified CRM data segment.
   */
  advertiser_id: string
  /**
   * Force Full Sync
   */
  __segment_internal_engage_force_full_sync: boolean
  /**
   * Supports batch sync via ADS
   */
  __segment_internal_engage_batch_sync: boolean
}
