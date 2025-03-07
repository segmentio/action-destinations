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
  /**
   * Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.
   */
  optinValue?: string
  /**
   * Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.
   */
  optoutValue?: string
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
   *                       A trailing underscore (_) is added to the match column name at the time of request
   *                       to Responsys.
   *                       This aligns with Responsys’ naming conventions for match columns.
   */
  matchColumnName1: string
  /**
   * Second match column for determining whether an insert or update should occur.
   *                       A trailing underscore (_) is added to the match column name at the time of request
   *                       to Responsys.
   *                       This aligns with Responsys’ naming conventions for match columns.
   */
  matchColumnName2?: string
  /**
   * String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)
   */
  rejectRecordIfChannelEmpty?: string
  /**
   * Optionally forward Responses from Segment's requests to Responsys to a Segment Source.
   */
  segmentWriteKey?: string
  /**
   * Segment Region to forward responses from Responsys to. Segment Source WriteKey must also be populated
   */
  segmentWriteKeyRegion?: string
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
