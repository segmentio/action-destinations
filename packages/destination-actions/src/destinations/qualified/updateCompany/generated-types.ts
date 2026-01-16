// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The domain of the company to update.
   */
  domain: string
  /**
   * String, text or picklist field values to set on all Leads associated with the Company.
   */
  string_fields?: {
    [k: string]: unknown
  }
  /**
   * boolean / checkbox field values to set on all Leads associated with the Company.
   */
  boolean_fields?: {
    [k: string]: unknown
  }
  /**
   * Numeric / decimal field values to set on all Leads associated with the Company.
   */
  number_fields?: {
    [k: string]: unknown
  }
}
