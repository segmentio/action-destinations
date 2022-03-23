// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
   * The lead's company. **This is required to create a lead.**
   */
  company?: string
  /**
   * The lead's last name. **This is required to create a lead.**
   */
  last_name?: string
  /**
   * The lead's first name.
   */
  first_name?: string
  /**
   * The lead's email address.
   */
  email?: string
  /**
   * City for the lead's address.
   */
  city?: string
  /**
   * Postal code for the lead's address.
   */
  postal_code?: string
  /**
   * Country for the lead's address.
   */
  country?: string
  /**
   * Street number and name for the lead's address.
   */
  street?: string
  /**
   * State for the lead's address.
   */
  state?: string
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
