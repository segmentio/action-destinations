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
   * Attached user to the Company
   */
  user_id?: string
  /**
   * The name of the company
   */
  name?: string
  /**
   * The monthly spend of the company
   */
  monthly_spend?: number
  /**
   * The plan of the company
   */
  plan?: string
  /**
   * The size of the company
   */
  size?: number
  /**
   * The website of the company
   */
  website?: string
  /**
   * The industry of the company
   */
  industry?: string
  /**
   * Passing any traits not mapped to individual fields as Custom Attributes
   */
  custom_attributes?: {
    [k: string]: unknown
  }
}
