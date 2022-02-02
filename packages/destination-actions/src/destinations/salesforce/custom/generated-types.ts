// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Operation
   */
  operation: string
  /**
   * Traits
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The name of the Salesforce object that records will be added or updated within. The object must be predefined in your Salesforce account. Values should end with "__c".
   */
  sobject: string
  /**
   *
   *   Custom fields to send to Salesforce. Fields must be predefined in your Salesforce account.
   *
   *   On the left-hand side, input the Salesforce field name with __c appended. On the right-hand side, map the Segment field that contains the value.
   *
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
