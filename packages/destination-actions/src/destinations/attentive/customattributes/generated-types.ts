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
   * Custom attributes to associate with the user.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * A unique identifier representing this specific event. Should be a UUID format.
   */
  externalEventId?: string
  /**
   * Timestamp for the event, ISO 8601 format.
   */
  occurredAt?: string
}
