// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * An object ID used to identify an object.
   */
  object_id?: string
  /**
   * An object ID type used to identify the type of object.
   */
  object_type_id?: string
  /**
   * Set as true to ensure Segment sends data to Customer.io in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
