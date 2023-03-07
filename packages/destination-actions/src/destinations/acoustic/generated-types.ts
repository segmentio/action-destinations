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
   * Client Id provided with Definition of Segment Events Application in Acoustic
   */
  a_client_id: string
  /**
   * Client Secret provided with Definition of Segment Events Application in Acoustic
   */
  a_client_secret: string
  /**
   * Refresh Token provided with Definition of Segment Events Application Access in Acoustic
   */
  a_refresh_token: string
  /**
   * Note: Before increasing the default max number, consult the Acoustic Destination documentation.
   */
  a_attributesMax?: number
  /**
   * The Segment Events Table List Id from the Database dialog in Acoustic Campaign
   */
  a_events_table_list_id?: string
}
