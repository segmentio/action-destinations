// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Reddit Audience ID to remove users from. You can find this in your Reddit Audience Manager page.
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
   * Remove emails from the Reddit Custom Audience List.
   */
  send_email?: boolean
  /**
   * Remove Mobile Advertising IDs (IDFA / AAID) from the Reddit Custom Audience List.
   */
  send_maid?: boolean
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
}
