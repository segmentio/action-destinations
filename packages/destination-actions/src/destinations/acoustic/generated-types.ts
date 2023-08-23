// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pod Number for API Endpoint
   */
  pod: string
  /**
   * Region for API Endpoint, either US, EU, AP, or CA
   */
  region: string
  /**
   * The Segment Table Name in Acoustic Campaign Data dialog.
   */
  tableName: string
  /**
   * The Segment Table List Id from the Database-Relational Table dialog in Acoustic Campaign
   */
  tableListId: string
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
   * A safety against mapping too many attributes into the Event, ignore Event if number of Event Attributes exceeds this maximum. Note: Before increasing the default max number, consult the Acoustic Destination documentation.
   */
  attributesMax?: number
  /**
   *
   * Last-Modified: 06.23.2023 12.42.42
   *
   */
  version?: string
}
