// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company ID of the company
   */
  company_id: string
  /**
   * The Segment traits to be forwarded to Intercom
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The name of the company
   */
  name: string
  /**
   * The time the company was created in your system
   */
  created_at?: string | number
  /**
   * The name of the plan the company is on
   */
  plan?: string
  /**
   * How much revenue the company generates for your business
   */
  monthly_spend?: number
  /**
   * The number of employees in the company
   */
  size?: number
  /**
   * The URL for the company website
   */
  website?: string
  /**
   * The industry of the company
   */
  industry?: string
}
