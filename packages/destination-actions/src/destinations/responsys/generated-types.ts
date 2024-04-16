// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Optionally forward Responses from Segment's requests to Responsys to a Segment Source.
   */
  segmentWriteKey?: string
  /**
   * Segment Region to forward responses from Responsys to. Segment Source WriteKey must also be populated
   */
  segmentWriteKeyRegion?: string
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
   * Controls how the existing record should be updated. Defaults to Replace All.
   */
  updateOnMatch: string
  /**
   * Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.
   */
  textValue?: string
  /**
   * Operator to join match column names.
   */
  matchOperator?: string
  /**
   * Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.
   */
  optoutValue?: string
  /**
   * String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)
   */
  rejectRecordIfChannelEmpty?: string
  /**
   * This value must be specified as either OPTIN or OPTOUT. defaults to OPTOUT.
   */
  defaultPermissionStatus: string
  /**
   * Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.
   */
  htmlValue?: string
  /**
   * Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.
   */
  optinValue?: string
}
