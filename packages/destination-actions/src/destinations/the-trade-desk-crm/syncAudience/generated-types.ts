// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of The Trade Desk CRM Data Segment you want to sync. If the audience name does not exist Segment will create one.
   */
  name: string
  /**
   * The geographical region of the CRM data segment based on the origin of PII.
   */
  region: string
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
