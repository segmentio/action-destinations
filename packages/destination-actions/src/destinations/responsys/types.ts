export interface Data {
  rawMapping: {
    userData: {
      [k: string]: unknown
    }
  }
}

export type MergeRule = {
  /**
   * Value of incoming preferred email format data. For example, 'H' may represent a preference for HTML formatted email.
   */
  htmlValue?: string
  /**
   * Value of incoming opt-in status data that represents an opt-in status. For example, 'I' may represent an opt-in status.
   */
  optinValue?: string
  /**
   * Value of incoming preferred email format data. For example, 'T' may represent a preference for Text formatted email.
   */
  textValue?: string
  /**
   * Indicates what should be done for records where a match is not found.
   */
  insertOnNoMatch?: boolean
  /**
   * Controls how the existing record should be updated.
   */
  updateOnMatch?: string
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
   * Value of incoming opt-out status data that represents an optout status. For example, '0' may represent an opt-out status.
   */
  optoutValue?: string
  /**
   * String containing comma-separated channel codes that if specified will result in record rejection when the channel address field is null. Channel codes are 'E' (Email), 'M' (Mobile), 'P' (Postal Code). For example 'E,M' would indicate that a record that has a null for Email or Mobile Number value should be rejected. This parameter can also be set to null or to an empty string, which will cause the validation to not be performed for any channel, except if the matchColumnName1 parameter is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_. When matchColumnName1 is set to EMAIL_ADDRESS_ or MOBILE_NUMBER_, then the null or empty string setting is effectively ignored for that channel.
   */
  rejectRecordIfChannelEmpty?: string
  /**
   * This value must be specified as either OPTIN or OPTOUT and would be applied to all of the records contained in the API call. If this value is not explicitly specified, then it is set to OPTOUT.
   */
  defaultPermissionStatus?: string
}

export type RecordData = {
  fieldNames: string[]
  records: unknown[][]
  mapTemplateName: string
}

export type ListMemberRequestBody = {
  recordData: RecordData
} & {
  mergeRule: MergeRule
}

export type CustomTraitsRequestBody = {
  recordData: RecordData
} & {
  insertOnNoMatch?: boolean
  updateOnMatch?: string
  matchColumnName1?: string
  matchColumnName2?: string
}
