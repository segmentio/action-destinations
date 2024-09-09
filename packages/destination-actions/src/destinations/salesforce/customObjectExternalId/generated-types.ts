// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Salesforce operation performed. The available operations are Create, Delete, Update or Upsert records in Salesforce.
   */
  operation: string
  /**
   * The API name of the Salesforce object that records will be added or updated within. This can be a standard or custom object. Custom objects must be predefined in your Salesforce account and should end with "__c".
   */
  customObjectName: string
  /**
   * The name of the field that will be used as the External ID.
   */
  externalIdField: string
  /**
   * The external id field value that will be used to update the record.
   */
  externalIdValue: string
  /**
   *
   *   Additional fields to send to Salesforce. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.
   *
   *   This can include standard or custom fields. Custom fields must be predefined in your Salesforce account and the API field name should have __c appended.
   *
   *   ---
   *
   *
   */
  customFields?: {
    [k: string]: unknown
  }
}
