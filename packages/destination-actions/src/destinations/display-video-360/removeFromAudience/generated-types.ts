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
   * Mobile Advertising ID. Android Advertising ID or iOS IDFA.
   */
  mobile_advertising_id?: string
  /**
   * Google GID - ID is deprecated in some areas and will eventually sunset.  ID is included for those who were on the legacy destination.
   */
  google_gid?: string
  /**
   * Partner Provided ID - Equivalent to the Segment Anonymous ID.  Segment Audience must include Anonymous Ids to match effectively.
   */
  partner_provided_id?: string
}
