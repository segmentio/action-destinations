// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Salesforce operation performed. The operations available create, update or upsert Lead records in Salesforce.
   */
  operation: string
  /**
   * The fields used to find Salesforce Lead records for updates. This is required if the Operation is Update or Upsert.
   *
   *   Any field can be matched on, including Record ID, External IDs, standard fields and custom fields. On the left-hand side, input the Salesforce field name. On the right-hand side, map the Segment field that contains the value.
   *
   *   If multiple records are found, we will not make any updates so we recommend using fields that contain unique values per record. Please see more information in our documentation.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The lead's company. This is required to create a lead.
   */
  company?: string
  /**
   * The lead's last name. This is required to create a lead.
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
}
