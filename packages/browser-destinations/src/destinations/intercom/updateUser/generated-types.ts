// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's identity
   */
  user_id?: string
  /**
   * The Segment traits to be forwarded to Intercom
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * User's name
   */
  name?: string
  /**
   * Phone number of the current user/lead
   */
  phone?: string
  /**
   * Sets the [unsubscribe status] of the record
   */
  unsubscribed_from_emails?: boolean
  /**
   * The messenger language (instead of relying on browser language settings)
   */
  language_override?: string
  /**
   * User's email
   */
  email?: string
  /**
   * A timestamp of when the person was created
   */
  created_at?: string | number
  /**
   * The avatar/profile image associated to the current record (typically gathered via social profiles via email address)
   */
  avatar?: {
    /**
     * An avatar image URL. Note: needs to be https
     */
    image_url?: string
    /**
     * is not sent by the user, manually set to avatar
     */
    type?: string
  }
  /**
   * Used for identity verification
   */
  user_hash?: string
  /**
   * The user's company
   */
  company?: {
    /**
     * The company ID of the company
     */
    company_id: string
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
    /**
     * the custom traits for the company object
     */
    company_traits?: {
      [k: string]: unknown
    }
  }
  /**
   * An array of companies the user is associated to
   */
  companies?: {
    /**
     * The company ID of the company
     */
    company_id: string
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
    /**
     * the custom traits for the company object
     */
    company_traits?: {
      [k: string]: unknown
    }
  }[]
}
