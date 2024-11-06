// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of event. This name is case sensitive. "Order shipped" and "Order Shipped" would be considered different event types.
   */
  type: string
  /**
   * Any metadata associated with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * A unique identifier representing this specific event. A UUID is recommended.
   */
  externalEventId?: string
  /**
   * Timestamp of when the action occurred in ISO 8601 format.
   */
  occurredAt?: string
  /**
   * Phone number of the user associated with the action. E.164 format is required. This field is required if either email or an externalIdentifier is not provided.
   */
  phone?: string
  /**
   * Email of the user associated with the action. This field is required if either phone or an externalIdentifier is not provided.
   */
  email?: string
  /**
   * (optional) Your primary ID for a user. This field is required if either phone, email, or a customIdentifier is not provided.
   */
  clientUserId?: string
  /**
   * (optional) Namespaced custom identifiers and their values. This field is required if either phone, email, or a clientUserId is not provided.
   */
  customIdentifiers?: {
    [k: string]: unknown
  }
}
