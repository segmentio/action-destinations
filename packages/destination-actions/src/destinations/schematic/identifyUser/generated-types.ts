// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Key-value pairs associated with a company (e.g. organization_id: 123456)
   */
  company_keys?: {
    [k: string]: unknown
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
     * Your unique ID for your user
     */
    user_id?: string
    [k: string]: unknown
  }
  /**
   * User's full name
   */
  user_name?: string
  /**
   * Properties associated with user
   */
  user_traits?: {
    [k: string]: unknown
  }
}
