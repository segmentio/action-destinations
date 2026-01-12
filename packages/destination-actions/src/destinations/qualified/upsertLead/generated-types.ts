// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the lead to upsert.
   */
  email: string
  /**
   * The phone number of the lead to upsert.
   */
  phone?: string
  /**
   * The company name of the lead to upsert.
   */
  company?: string
  /**
   * The name of the lead to upsert.
   */
  name?: string
  /**
   * Additional string fields to set on the lead.
   */
  string_fields?: {
    [k: string]: unknown
  }
  /**
   * Additional boolean fields to set on the lead.
   */
  boolean_fields?: {
    [k: string]: unknown
  }
  /**
   * Additional number fields to set on the lead.
   */
  number_fields?: {
    [k: string]: unknown
  }
}
