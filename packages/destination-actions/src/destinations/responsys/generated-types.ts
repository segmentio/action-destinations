// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Responsys username
   */
  username: string
  /**
   * Responsys password
   */
  userPassword: string
  /**
   * Responsys endpoint URL. Refer to Responsys documentation for more details. Must start with 'HTTPS://'. See [Responsys docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm).
   */
  baseUrl: string
  /**
   * Name of the Profile Extension Table's Contact List.
   */
  profileListName: string
  /**
   * Profile Extension Table (PET) Name. Required if using the "Send Custom Traits" Action.
   */
  profileExtensionTable?: string
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch: boolean
  /**
   * First match column for determining whether an insert or update should occur.
   */
  matchColumnName1: string
  /**
   * Second match column for determining whether an insert or update should occur.
   */
  matchColumnName2?: string
  /**
   * Controls how the existing record should be updated. Defaults to Replace All.
   */
  updateOnMatch: string
}
