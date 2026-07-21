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
   * Additional string, text, picklist fields to set on the Lead.
   */
  string_fields?: {
    [k: string]: unknown
  }
  /**
   * Additional boolean / checkbox fields to set on the Lead.
   */
  boolean_fields?: {
    [k: string]: unknown
  }
  /**
   * Additional numeric / decimal fields to set on the Lead.
   */
  number_fields?: {
    [k: string]: unknown
  }
}
