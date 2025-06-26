// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external ID of the user to identify.
   */
  external_id: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name: string
    alias_label: string
  }
  /**
   * Email address to identify user.
   */
  email_to_identify?: string
  /**
   * Prioritization settings for user merging if multiple users are found. Required when email_to_identify is provided.
   */
  prioritization?: {
    /**
     * First priority for user merging if multiple users are found
     */
    first_priority?: string
    /**
     * Second priority for user merging if multiple users are found
     */
    second_priority?: string
  }
  /**
   * Sets the endpoint to merge some fields found exclusively on the anonymous user to the identified user. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_user_identify/#request-parameters).
   */
  merge_behavior?: string
}
