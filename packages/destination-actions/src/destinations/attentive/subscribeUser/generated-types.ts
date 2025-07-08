// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * At least one identifier is required. Custom identifiers can be added as additional key:value pairs.
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
    /**
     * A primary ID for a user. Should be a UUID.
     */
    clientUserId?: string
    [k: string]: unknown
  }
  /**
   * Timestamp for the event, ISO 8601 format.
   */
  occurredAt?: string
  /**
   * A unique identifier representing this specific event.
   */
  externalEventId?: string
  /**
   * Type of subscription
   */
  subscriptionType: string
  /**
   * User locale. e.g. "en-US". Either Locale or Signup Source ID is required.
   */
  locale?: string
  /**
   * A unique identifier for the sign up source. Talk to your Attentive represenative. Either Locale or Signup Source ID is required.
   */
  signUpSourceId?: string
  /**
   * Whether to use single opt-in for the subscription.
   */
  singleOptIn?: boolean
}
