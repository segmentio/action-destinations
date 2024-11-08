// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The ID of the Snap Ad Account
   */
  ad_account_id: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Name for the audience that will be created in Snap. Defaults to the snake_cased Segment audience name if left blank.
   */
  customAudienceName?: string
  /**
   * Description of for the audience that will be created in Snap.
   */
  description?: string
  /**
   * # of days to retain audience members. (Default retention is lifetime represented as 9999)
   */
  retention_in_days?: number
}
