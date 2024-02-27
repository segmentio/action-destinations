// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier set by you
   */
  source_id: string
  /**
   * Properties to set on the user profile
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * The referral code of the user
   */
  referral_code?: string | null
}
