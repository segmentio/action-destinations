// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of event
   */
  event_name: string
  /**
   * Key-value pairs associated with a company (e.g. organization_id: 123456)
   */
  company_keys?: {
    [k: string]: unknown
  }
  /**
   * Key-value pairs associated with a user (e.g. email: example@example.com)
   */
  user_keys?: {
    /**
     * Your unique ID for your user
     */
    user_id?: string
    [k: string]: unknown
  }
  /**
   * Additional properties to send with event
   */
  traits?: {
    [k: string]: unknown
  }
}
