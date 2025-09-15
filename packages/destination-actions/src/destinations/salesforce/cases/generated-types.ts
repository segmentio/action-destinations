// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Salesforce operation performed. The available operations are Create, Delete, Update or Upsert records in Salesforce.
   */
  operation: string
  /**
   * This field affects how Segment uses the record matchers to query Salesforce records. By default, Segment uses the "OR" operator to query Salesforce for a record. If you would like to query Salesforce records using a combination of multiple record matchers, change this to "AND".
   */
  recordMatcherOperator?: string
  /**
   * If true, events are sent to [Salesforce’s Bulk API 2.0](https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/asynch_api_intro.htm) rather than their streaming REST API. Once enabled, Segment will collect events into batches of 5000 before sending to Salesforce.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The fields used to find Salesforce records for updates. **This is required if the operation is Delete, Update or Upsert.**
   *
   *   Any field can function as a matcher, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.
   *
   *   If multiple records are found, no changes will be made. **Please use fields that result in unique records.**
   *
   *   ---
   *
   *
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The external id field name and mapping to use for bulk upsert.
   */
  bulkUpsertExternalId?: {
    /**
     * The external id field name as defined in Salesforce.
     */
    externalIdName?: string
    /**
     * The external id field value to use for bulk upsert.
     */
    externalIdValue?: string
  }
  /**
   * The record id value to use for bulk update.
   */
  bulkUpdateRecordId?: string
  /**
   * A text description of the case.
   */
  description?: string
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
