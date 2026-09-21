// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762). This is required to set up the connection, but can be overriden using the Engage Audience setting named "Advertiser Account ID".
   */
  retlAdAccountId: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762). This overrides the main Destination settings named "Advertiser Account ID".
   */
  engageAdAccountId?: string
  /**
   * Choose to either create a new custom audience or connect to an existing one. If connecting to an existing audience, paste in the Facebook Audience ID you want to connect to in the "Existing Audience ID" field below.
   */
  operation?: string
  /**
   * The ID of the audience in Facebook
   */
  existingAudienceId?: string
  /**
   * A brief description about your audience.
   */
  audienceDescription?: string
  /**
   * Optionally categorize this audience with one of Meta's predefined labels. Sent to Facebook when the audience is created; does not apply retroactively to existing audiences.
   */
  audienceLabel?: string
}
