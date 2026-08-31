// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment's unique message ID. GainTrace stores it as the event's deduplication key, so redelivered or replayed events are counted once.
   */
  messageId: string
  /**
   * The name of the event, for example "Report Exported".
   */
  eventName: string
  /**
   * When the event occurred, as an ISO-8601 timestamp. GainTrace stores this rather than the time of receipt, so historical replays land on the correct dates.
   */
  timestamp: string | number
  /**
   * The identifier for the person who performed the event. Matched against a GainTrace person by external ID or email. Required unless an Anonymous ID is provided.
   */
  userId?: string
  /**
   * The anonymous identifier for the visitor, used when no User ID is known yet. Required unless a User ID is provided.
   */
  anonymousId?: string
  /**
   * How GainTrace should classify the event.
   */
  eventCategory?: string
  /**
   * Properties to store alongside the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If true, Segment sends events to GainTrace in batches. GainTrace accepts up to 1000 events per request.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
