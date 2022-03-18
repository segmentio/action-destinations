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
   * Name of the account. **This is required to create an account.**
   */
  name?: string
  /**
   * Account number assigned to the account. This is not the unique, Salesforce-generated ID assigned during creation.
   */
  account_number?: string
  /**
   * Number of employees working at the company represented by the account.
   */
  number_of_employees?: number
  /**
   * City for the billing address of the account.
   */
  billing_city?: string
  /**
   * Postal code for the billing address of the account.
   */
  billing_postal_code?: string
  /**
   * Country for the billing address of the account.
   */
  billing_country?: string
  /**
   * Street address for the billing address of the account.
   */
  billing_street?: string
  /**
   * State for the billing address of the account.
   */
  billing_state?: string
  /**
   * City for the shipping address of the account.
   */
  shipping_city?: string
  /**
   * Postal code for the shipping address of the account.
   */
  shipping_postal_code?: string
  /**
   * Country for the shipping address of the account.
   */
  shipping_country?: string
  /**
   * Street address for the shipping address of the account.
   */
  shipping_street?: string
  /**
   * State for the shipping address of the account.
   */
  shipping_state?: string
  /**
   * Phone number for the account.
   */
  phone?: string
  /**
   * Text description of the account.
   */
  description?: string
  /**
   * The website of the account.
   */
  website?: string
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
