// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Reddit Audience ID to add users to. You can find this in your Reddit Audience Manager page.
   */
  audience_id: string
  /**
   * The user's email address.
   */
  email?: string
  /**
   * The user's mobile advertising ID (IDFA or AAID)
   */
  maid?: string
  /**
   * Send emails to Reddit to add to the Custom Audience List.
   */
  send_email?: boolean
  /**
   * Send Mobile Advertising IDs (IDFA / AAID) to Reddit to add to the Custom Audience List.
   */
  send_maid?: boolean
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
}
