// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.
   */
  event_name: string
  /**
   * The time the event occurred as a UTC Unix timestamp. Segment will convert to Unix if not already converted.
   */
  created_at: string | number
  /**
   * Your identifier for the user who performed the event. User ID is required if no email or Contact ID is provided.
   */
  user_id?: string
  /**
   * The email address for the user who performed the event. Email is required if no User ID or Contact ID is provided.
   */
  email?: string
  /**
   * The amount associated with a purchase. Segment will multiply by 100 as Intercom requires the amount in cents.
   */
  revenue?: number
  /**
   * The currency of the purchase amount. Segment will default to USD if revenue is provided without a currency.
   */
  currency?: string
  /**
   * Intercom's unique identifier for the contact. If no Contact ID is provided, Segment will use User ID or Email to find a user or lead.
   */
  id?: string
  /**
   * Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Intercom will ignore the rest. Intercom does not support nested JSON structures within metadata.
   */
  metadata?: {
    [k: string]: unknown
  }
}
