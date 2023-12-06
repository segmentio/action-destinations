// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the profile extension table’s parent profile list.
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
  mapTemplateName?: string
  /**
   * This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.
   */
  defaultPermissionStatus?: string
  /**
   * Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.
   */
  htmlValue?: string
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch?: boolean & string
  /**
   * First match column for determining whether an insert or update should occur.
   */
  matchColumnName1?: string
  /**
   * Second match column for determining whether an insert or update should occur.
   */
  matchColumnName2?: string
  /**
   * Operator to join match column names.
   */
  matchOperator?: string
  /**
   * Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.
   */
  optinValue?: string
  /**
   * Value of incoming opt-out status data that represents an optout status. For example, '0' may represent an opt-out status.
   */
  optoutValue?: string
  /**
   * String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. Channel codes are 'E' (Email), 'M' (Mobile), 'P' (Postal Code). For example 'E,M' would indicate that a record that has a null for Email or Mobile Number value should be rejected. This parameter can also be set to null or to an empty string, which will cause the validation to not be performed for any channel, except if the matchColumnName1 parameter is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_. When matchColumnName1 is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_, then the null or empty string setting is effectively ignored for that channel.
   */
  rejectRecordIfChannelEmpty?: string
  /**
   * Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.
   */
  textValue?: string
  /**
   * Controls how the existing record should be updated.
   */
  updateOnMatch: string
  /**
   * Once enabled, Segment will collect events into batches of 200 before sending to Responsys.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
