// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The CRM Data ID for The Trade Desk Segment.
   */
  external_id?: string
  /**
   * The type of personally identifiable data (PII) sent by the advertiser.
   */
  pii_type: string
  /**
   * The user's email address to send to The Trade Desk.
   */
  email?: string
  /**
   * Enable batching of requests to The Trade Desk CRM Segment.
   */
  enable_batching?: boolean
  /**
   * The name of the current Segment event.
   */
  event_name?: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
