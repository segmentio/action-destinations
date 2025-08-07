// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the person that this mobile device belongs to.
   */
  person_id: string
  /**
   * The device token of a customer's mobile device.
   */
  device_id: string
  /**
   * Set as true to ensure Segment sends data to Customer.io in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
