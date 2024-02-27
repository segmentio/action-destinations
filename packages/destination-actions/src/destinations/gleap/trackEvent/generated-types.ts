// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event that occurred. Names are treated as case insensitive. Periods and dollar signs in event names are replaced with hyphens.
   */
  eventName?: string
  /**
   * The type of the Segment event
   */
  type: string
  /**
   * The associated page url of the Segment event
   */
  pageUrl?: string
  /**
   * The time the event took place in ISO 8601 format. Segment will convert to Unix before sending to Gleap.
   */
  date: string | number
  /**
   * Your identifier for the user who performed the event. User ID is required.
   */
  userId: string
  /**
   * Optional metadata describing the event. Each event can contain up to ten metadata key-value pairs. If you send more than ten keys, Gleap will ignore the rest.
   */
  data?: {
    [k: string]: unknown
  }
}
