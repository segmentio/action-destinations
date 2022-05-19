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
   * The contact's last name up to 80 characters. **This is required to create a contact.**
   */
  last_name?: string
  /**
   * The contact's first name up to 40 characters.
   */
  first_name?: string
  /**
   * The ID of the account that this contact is associated with. This is the Salesforce-generated ID assigned to the account during creation (i.e. 0018c00002CDThnAAH).
   */
  account_id?: string
  /**
   * The contact's email address.
   */
  email?: string
  /**
   * City for the contact's mailing address.
   */
  mailing_city?: string
  /**
   * Postal Code for the contact's mailing address.
   */
  mailing_postal_code?: string
  /**
   * Country for the contact's mailing address.
   */
  mailing_country?: string
  /**
   * Street number and name for the contact's mailing address.
   */
  mailing_street?: string
  /**
   * State for the contact's mailing address.
   */
  mailing_state?: string
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
