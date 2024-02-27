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
}
