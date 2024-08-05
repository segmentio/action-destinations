// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event to send to Hubspot.
   */
  event_name: string
  /**
   * Details of the record to associate the event with
   */
  record_details: {
    /**
     * The type of Hubspot Object to associate the event with.
     */
    object_type: string
    /**
     * The name of the ID field for the record.
     */
    object_id_field_name: string
    /**
     * The ID value for the record.
     */
    record_id_value: string
  }
  /**
   * Properties to send with the event.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The time when this event occurred.
   */
  occurred_at?: string | number
  /**
   * By default Segment batches events to Hubspot.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size: number
}
