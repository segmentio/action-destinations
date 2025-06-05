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
   * Email addresses to identify users. Each entry requires an external_id, email, and prioritization array.
   */
  emails_to_identify?: {
    /**
     * The external ID to associate with this email.
     */
    external_id: string
    /**
     * The email address to identify.
     */
    email: string
    /**
     * Prioritization settings for user merging if multiple users are found
     */
    prioritization: {
      /**
       * First priority for user merging if multiple users are found
       */
      first_priority: string
      /**
       * Second priority for user merging if multiple users are found
       */
      second_priority?: string
    }
  }[]
  /**
   * Sets the endpoint to merge some fields found exclusively on the anonymous user to the identified user. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_user_identify/#request-parameters).
   */
  merge_behavior?: string
}
