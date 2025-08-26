// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the person that this mobile device belongs to.
   */
  person_id: string
  /**
   * An optional anonymous ID. This is used to tie anonymous events to this person. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * An object ID used to identify an object.
   */
  object_id: string
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
