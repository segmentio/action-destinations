// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier for the user to add to the audience. Can only be one of the following. Basic User Lists only support Publisher Provided ID. Customer Match Lists support all four identifiers.
   */
  user_identifier: string
  /**
   * Enable batching of requests to the TikTok Audiences.
   */
  enable_batching?: boolean
  /**
   * The Audience ID in Google's DB.
   */
  external_audience_id: string
}
