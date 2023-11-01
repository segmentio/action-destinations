// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identifier for the user.
   */
  user_id?: string
  /**
   * The user's custom attributes.
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The user's name.
   */
  name?: string
  /**
   * The user's phone number.
   */
  phone?: string

  email?: string
  /**
   * The time the user was created in your system.
   */
  created_at?: string | number

  company?: {
    /**
     * The unique identifier of the company.
     */
    company_id: string
    /**
     * The name of the company.
     */
    name: string
    /**
     * The time the company was created in your system.
     */
    created_at?: string | number
    /**
     * The name of the plan you have associated with the company.
     */
    plan?: string
    /**
     * The monthly spend of the company, e.g. how much revenue the company generates for your business.
     */
    monthly_spend?: number
    /**
     * The number of employees in the company.
     */
    size?: number
    /**
     * The URL for the company website.
     */
    website?: string
    /**
     * The industry that the company operates in.
     */
    industry?: string
    /**
     * The custom attributes for the company object.
     */
    company_custom_traits?: {
      [k: string]: unknown
    }
  }

  total_spend: number
  plan: string
  role: string
  language: string
}
