// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique identifier for the profile using Twilio Type ID (TTID) format. If not provided, will attempt to use userId or anonymousId.
   */
  profileId?: string
  /**
   * Contact information object containing email, firstName, lastName, and phone fields that will be placed in traits.Contact in the Memora API call.
   */
  contact?: {
    /**
     * User email address
     */
    email?: string
    /**
     * User first name
     */
    firstName?: string
    /**
     * User last name
     */
    lastName?: string
    /**
     * User phone number
     */
    phone?: string
  }
}
