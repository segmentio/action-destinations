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
   * Optional. To sync to an audience which already exists in Facebook, paste the Facebook Custom Audience ID here and Segment will connect to that audience instead of creating a new one. The Description and Audience Label settings are ignored when this field is populated. Leave this field blank to create a new Facebook Custom Audience.
   */
  existingAudienceId?: string
  /**
   * A brief description about your audience. Only applies when Segment creates a new audience; ignored when an Existing Audience ID is provided.
   */
  audienceDescription?: string
  /**
   * Optionally categorize this audience with one of Meta's predefined labels. Only applies when Segment creates a new audience; ignored when an Existing Audience ID is provided, and a label added here later does not apply to an audience which already exists.
   */
  audienceLabel?: string
}
