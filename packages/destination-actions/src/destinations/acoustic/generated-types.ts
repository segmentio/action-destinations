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
   * Client Id provided with Definition of Audience Application in Acoustic
   */
  a_client_id: string
  /**
   * Client Secret provided with Definition of Audience Application in Acoustic
   */
  a_client_secret: string
  /**
   * Refresh Token provided with Defnition of Audience Application Access in Acoustic
   */
  a_refresh_token: string
  /**
   * Note to Implementation Staff: "Max" definitions translate to the Maximum Number of rows written per API call and then to the number of rows written per unique email to the Acoustic table. See documentation to determine the Max allowed per data item.
   */
  a_attributesMax?: number
  /**
   * Do not change unless directed by Support
   */
  a_authAPIURL?: string
  /**
   * Do not change unless directed by Support
   */
  a_xmlAPIURL?: string
  /**
   * Reserved for Support, code to delete and recreate the Acoustic "Segment Audience Table" effectively resetting all Segment Audience data in Acoustic
   */
  a_deleteCode?: number
}
