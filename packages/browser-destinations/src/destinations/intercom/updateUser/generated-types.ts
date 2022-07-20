// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's identity.
   */
  user_id?: string
  /**
   * The user's custom traits.
   */
  custom_traits?: {
    [k: string]: unknown
  }
  /**
   * The user's name.
   */
  name?: string
  /**
   * The user's first name.
   */
  first_name?: string
  /**
   * The user's last name.
   */
  last_name?: string
  /**
   * The user's phone number.
   */
  phone?: string
  /**
   * The user's email unsubscribe status.
   */
  unsubscribed_from_emails?: boolean
  /**
   * The user's messenger language (instead of relying on browser language settings).
   */
  language_override?: string
  /**
   * The user's email.
   */
  email?: string
  /**
   * A timestamp of when the user was created.
   */
  created_at?: string | number
  /**
   * The user's avatar/profile image.
   */
  avatar?: {
    /**
     * The avatar/profile image URL.
     */
    image_url: string
    /**
     * This is manually set to 'avatar'.
     */
    type: string
  }
  /**
   * This is used for identity verification.
   */
  user_hash?: string
  /**
   * The user's company.
   */
  company?: {
    /**
     * The company id of the company.
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
     * The name of the plan the company is on.
     */
    plan?: string
    /**
     * How much revenue the company generates for your business.
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
     * The industry of the company.
     */
    industry?: string
    /**
     * The custom traits for the company object.
     */
    company_custom_traits?: {
      [k: string]: unknown
    }
  }
  /**
   * The array of companies the user is associated to.
   */
  companies?: {
    /**
     * The company id of the company.
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
     * The name of the plan the company is on.
     */
    plan?: string
    /**
     * How much revenue the company generates for your business.
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
     * The industry of the company.
     */
    industry?: string
    /**
     * The custom traits for the company object.
     */
    company_custom_traits?: {
      [k: string]: unknown
    }
  }[]
  /**
   * Selectively show the chat widget. According to Intercom’s docs, you want to first hide the Messenger for all users inside their UI using Messenger settings. Then think about how you want to programmatically decide which users you’d like to show the widget to.
   */
  hide_default_launcher?: boolean
}
