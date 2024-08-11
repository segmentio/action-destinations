// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external ID of the user to identify.
   */
  external_id: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias: {
    alias_name: string
    alias_label: string
  }
  /**
   * Sets the endpoint to merge some fields found exclusively on the anonymous user to the identified user. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_user_identify/#request-parameters).
   */
  merge_behavior?: string
  /**
   * If true, Segment will batch events before sending to Braze’s identify user endpoint. Braze accepts batches of up to 50 events for this endpoint.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
