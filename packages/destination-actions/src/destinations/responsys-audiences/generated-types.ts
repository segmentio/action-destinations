// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Responsys endpoint URL. Refer to Responsys documentation for more details. Must start with 'HTTPS://'. See [Responsys docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm).
   */
  baseUrl: string
  /**
   * Responsys username
   */
  username: string
  /**
   * Responsys password
   */
  userPassword: string
  /**
   * Name of the Profile Extension Table's Contact List.
   */
  profileListName?: string
  /**
   * Name of the folder where the Profile Extension Table is located.
   */
  defaultFolderName?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch: boolean
  /**
   * Controls how the existing record should be updated. Defaults to Replace All.
   */
  updateOnMatch: string
  /**
   * First match column for determining whether an insert or update should occur.
   *                     A trailing underscore (_) is added to the match column name at the time of request
   *                     to Responsys.
   *                     This aligns with Responsys’ naming conventions for match columns.
   */
  matchColumnName1: string
  /**
   * Second match column for determining whether an insert or update should occur.
   *                     A trailing underscore (_) is added to the match column name at the time of request
   *                     to Responsys.
   *                     This aligns with Responsys’ naming conventions for match columns.
   */
  matchColumnName2?: string
}
