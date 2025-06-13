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
   * A unique identifier representing this specific event. Should be a UUID format.
   */
  externalEventId?: string
  /**
   * Metadata to associate with the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
