// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User Data
   */
  user_data?: {
    /**
     * User Email
     */
    email?: string
    /**
     * User phone number
     */
    phone?: string
    /**
     * User gender
     */
    gender?: string
    /**
     * Date of Birth
     */
    dateOfBirth?: string
    /**
     * Last Name
     */
    lastName?: string
    /**
     * First Name
     */
    firstName?: string
    /**
     * City
     */
    city?: string
    /**
     * State
     */
    state?: string
    /**
     * Zip Code
     */
    zip?: string
    /**
     * Country
     */
    country?: string
    /**
     * External ID
     */
    externalId?: string
    /**
     * Client IP Address
     */
    client_ip_address?: string
    /**
     * Client User Agent
     */
    client_user_agent?: string
    /**
     * Click ID
     */
    clickID?: string
    /**
     * Browser ID
     */
    browserID?: string
    /**
     * Subscription ID
     */
    subscriptionID?: string
    /**
     * Lead ID
     */
    leadID?: string
    /**
     * Facebook Login ID
     */
    fbLoginID?: string
  }
  /**
   * Time of event
   */
  event_time: number
  /**
   * Action source
   */
  action_source: string
  /**
   * Product IDs associated with the event, such as SKUs (e.g. ["ABC123", "XYZ789"]).
   */
  content_ids?: {
    [k: string]: unknown
  }
  /**
   * Content Category
   */
  content_category?: string
  /**
   * Name of the page/product.
   */
  content_name?: string
  /**
   * content type
   */
  content_type?: string
  /**
   * An array of JSON objects
   */
  contents?: {
    [k: string]: unknown
  }
  /**
   * currency
   */
  currency?: string
  /**
   * value
   */
  value?: number
}
