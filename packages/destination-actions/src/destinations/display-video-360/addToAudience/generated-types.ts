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
   * Mobile Advertising ID. This could be a GAID, or IDFA. Remove if not needed.
   */
  mobile_advertising_id?: string
  /**
   * Google GID. Remove if not needed.
   */
  google_gid?: string
  /**
   * Partner Provided ID. Remove if not needed.
   */
  partner_provided_id?: string
}
