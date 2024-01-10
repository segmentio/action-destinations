// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Key-value pairs associated with a company (e.g. organization_id: 123456)
   */
  company_keys?: {
    /**
     * Segment groupId
     */
    groupId?: string
    /**
     * Organization ID
     */
    organization_id?: string
  }
  /**
   * Name of company
   */
  company_name?: string
  /**
   * Properties associated with company
   */
  company_traits?: {
    [k: string]: unknown
  }
  /**
   * Key-value pairs associated with a user (e.g. email: example@example.com)
   */
  user_keys: {
    /**
     * Email address
     */
    email_address?: string
    /**
     * Segment userId
     */
    userId?: string
  }
  /**
   * Name of user
   */
  user_name?: string
  /**
   * Properties associated with user
   */
  user_traits?: {
    [k: string]: unknown
  }
}
