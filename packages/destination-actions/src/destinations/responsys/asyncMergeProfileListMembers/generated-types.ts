// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the Profile Extension Table's Contact List.
   */
  profileListName: string
  /**
   * Record data that represents Field Names and corresponding values for the recipient.
   */
  userData: {
    [k: string]: unknown
  }
  /**
   * The Map Template in Responsys that can be used to map Field Names of the Profile List to Column Names.
   */
  mapTemplateName: string
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch?: boolean
  /**
   * First match column for determining whether an insert or update should occur.
   */
  matchColumnName1?: string
  /**
   * Second match column for determining whether an insert or update should occur.
   */
  matchColumnName2?: string
  /**
   * Controls how the existing record should be updated.
   */
  updateOnMatch: string
  /**
   * This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.
   */
  defaultPermissionStatus?: string
  /**
   * Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.
   */
  htmlValue?: string
  /**
   * Operator to join match column names.
   */
  matchOperator?: string
  /**
   * Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.
   */
  optinValue?: string
  /**
   * Value of incoming opt-out status data that represents an optout status. For example, 'O' may represent an opt-out status.
   */
  optoutValue?: string
  /**
   * String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. See [Responsys API docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-rest-api/op-rest-api-v1.3-lists-listname-members-post.html)
   */
  rejectRecordIfChannelEmpty?: string
  /**
   * Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.
   */
  textValue?: string
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
