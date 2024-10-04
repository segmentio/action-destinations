// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user ID to delete.
   */
  userId?: string
  /**
   * The anonymous ID to delete.
   */
  anonymousId?: string
  /**
   * Comma-separated list of advertiser IDs. If not provided, it will query the token info.
   */
  advertiserId?: string
  /**
   * The external provider to delete the profile from.
   */
  externalProvider?: string
}
