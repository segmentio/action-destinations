// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The time the company was created by you.
   */
  remote_created_at?: string | number
  /**
   * The unique identifier of the company. Can't be updated.
   */
  company_id: string
  /**
   * Attach this contact to the company. This ID is NOT the external_id or email; it is the Intercom unique identifier.
   */
  contact_id?: string
  /**
   * The name of the company.
   */
  name?: string
  /**
   * The monthly spend of the company.
   */
  monthly_spend?: number
  /**
   * The plan of the company.
   */
  plan?: string
  /**
   * The size of the company.
   */
  size?: number
  /**
   * The website of the company.
   */
  website?: string
  /**
   * The industry of the company.
   */
  industry?: string
  /**
   * Passing any traits not mapped to individual fields as Custom Attributes. Note: Will throw an error if you pass an attribute that isn`t explicitly defined.
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
