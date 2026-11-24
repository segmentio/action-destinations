// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the user in Vero. Required if no Email is provided.
   */
  userId?: string
  /**
   * The email address of the user. Required if no User ID is provided.
   */
  email?: string
  /**
   * The name of the event.
   */
  eventName: string
  /**
   * Properties of the event. All values are sent to Vero as strings.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Vero drops events with the same name, properties and user within 5 minutes. Map a unique value, such as the Segment message ID, to make each event unique. Sent to Vero as the segment_event_id event property. Leave empty to keep Vero deduplication.
   */
  deduplicationValue?: string
  /**
   * When the event or change occurred. Sent to Vero as an ISO 8601 string.
   */
  createdAt?: string | number
}
