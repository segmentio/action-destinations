export interface DynamicData {
  [key: string]: any
}

// Define an interface for the inner object
export interface InnerObject {
  [key: string]: any
}

export interface RecordData {
  records: DynamicData[][]
  fieldNames: string[]
  mapTemplateName: string
}

export interface MergeRule {
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
  updateOnMatch?: string
}

// type RequestBody = RecordData & MergeRule;

// interface FetchRequest {
//   method: string;
//   headers: {
//     Authorization: string;
//     'Content-Type': string;
//   };
//   body: string;
// }
