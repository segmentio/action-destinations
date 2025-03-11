// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * At least one identifier (phone or email) is required.
   */
  userIdentifiers: {
    /**
     * The user's phone number in E.164 format.
     */
    phone?: string
    /**
     * The user's email address.
     */
    email?: string
    [k: string]: unknown
  }
  /**
   * Type of subscription (MARKETING or TRANSACTIONAL)
   */
  subscriptionType: string
  /**
   * User locale (language and country)
   */
  locale?: {
    language: string
    country: string
  }
}
