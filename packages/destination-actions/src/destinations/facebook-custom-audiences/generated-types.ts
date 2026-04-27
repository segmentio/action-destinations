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
   * A brief description about your audience.
   */
  audienceDescription: string
}
