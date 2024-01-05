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
   * Key-value pairs associated with a user (e.g. email: example@example.com)
   */
  user_keys?: {
    /**
     * Segment userId
     */
    userId?: string
  }
  /**
   * Additional properties to send with event
   */
  traits?: {
    [k: string]: unknown
  }
}
