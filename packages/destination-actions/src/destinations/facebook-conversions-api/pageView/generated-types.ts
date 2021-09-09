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
   * Action source
   */
  action_source: string
  /**
   * Time of event
   */
  event_time: number
}
