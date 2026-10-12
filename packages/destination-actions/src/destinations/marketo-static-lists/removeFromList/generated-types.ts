// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Static List that users will be synced to.
   */
  external_id?: string
  /**
   * The lead field to use for deduplication and filtering. This field must be a part of the Lead Info Fields below.
   */
  lookup_field: string
  /**
   * The value corresponding to the lookup field.
   */
  field_value: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * The name of the current Segment event.
   */
  event_name: string
}
