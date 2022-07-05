// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A test dynamic field.
   */
  test_dynamic_field?: string
  /**
   * The Salesforce operation performed. The available operations are Create, Update or Upsert records in Salesforce.
   */
  operation: string
  /**
   * The fields used to find Salesforce records for updates. **This is required if the operation is Update or Upsert.**
   *
   *   Any field can function as a matcher, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field API name. On the right-hand side, map the Segment field that contains the value.
   *
   *   If multiple records are found, no updates will be made. **Please use fields that result in unique records.**
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
