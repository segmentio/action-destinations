// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pod Number of Campaign Instance
   */
  a_pod: string
  /**
   * Region where Pod is hosted, either US, EU, AP, or CA
   */
  a_region: string
  /**
   * The Segment Events Table List Id from the Database dialog in Acoustic Campaign
   */
  a_events_table_list_id?: string
  /**
   * The Client Id from the App definition dialog in Acoustic Campaign
   */
  a_clientId: string
  /**
   * The Client Secret from the App definition dialog in Acoustic Campaign
   */
  a_clientSecret: string
  /**
   * The RefreshToken provided when defining access for the App in Acoustic Campaign
   */
  a_refreshToken: string
  /**
   * Note: Before increasing the default max number, consult the Acoustic Destination documentation.
   */
  a_attributesMax?: number
}
