// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Enable batching of requests to the TikTok Audiences.
   */
  enable_batching: boolean
  /**
   * The Audience ID in Google's DB.
   */
  external_audience_id: string
  /**
   * Mobile Advertising ID. This could be a GAID, or IDFA.
   */
  mobile_advertising_id?: string
  /**
   * Google GID.
   */
  google_gid?: string
  /**
   * Partner Provided ID.
   */
  partner_provided_id?: string
}
