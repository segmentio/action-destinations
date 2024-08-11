// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external ID of the user to create an alias for.
   */
  external_id?: string | null
  /**
   * The alias identifier
   */
  alias_name: string
  /**
   * A label indicating the type of alias
   */
  alias_label: string
  /**
   * If true, Segment will batch events before sending to Braze’s create alias endpoint. Braze accepts batches of up to 50 events for this endpoint.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
