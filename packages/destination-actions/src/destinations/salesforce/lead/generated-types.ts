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
   * Company
   */
  company?: string
  /**
   * Last Name
   */
  last_name?: string
  /**
   * First Name
   */
  first_name?: string
  /**
   * Email
   */
  email?: string
  /**
   * City
   */
  city?: string
  /**
   * Postal Code
   */
  postal_code?: string
  /**
   * Country
   */
  country?: string
  /**
   * Street
   */
  street?: string
  /**
   * State
   */
  state?: string
  /**
   * Additional standard fields to send to Salesforce. On the left-hand side, input the Salesforce standard field name. On the right-hand side, map the Segment field that contains the value.
   */
  standard_fields?: {
    [k: string]: unknown
  }
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
