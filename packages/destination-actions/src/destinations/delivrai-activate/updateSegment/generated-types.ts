// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Delivr AI Audience Segment.
   */
  segment_audience_id?: string
  /**
   * Email address of a user.
   */
  email: string
  /**
   * Phone number of a user.
   */
  phone?: string
  /**
   * User's mobile device type
   */
  device_type?: string
  /**
   * User's mobile advertising Id.
   */
  advertising_id?: string
  /**
   * Segment Audience Key. Maps to the "Name" of the Segment node in Delivr AI Audience Segmentation.
   */
  segment_audience_key: string
  /**
   * If true, batch requests to Delivr AI. Delivr AI accepts batches of up to 1000 events. If false, send each event individually.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
