// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User identifier for the user to be merged (the user to be deprecated). Must specify one of: External ID, User Alias, Braze ID, Email, or Phone. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_users_merge/).
   */
  identifier_to_merge: {
    /**
     * The external ID of the user to merge
     */
    external_id?: string
    /**
     * The user alias object identifying the user to merge
     */
    user_alias?: {
      alias_name?: string
      alias_label?: string
    }
    /**
     * The Braze ID of the user to merge
     */
    braze_id?: string
    /**
     * The email address of the user to merge
     */
    email?: string
    /**
     * The phone number of the user to merge in E.164 format (e.g., +14155552671)
     */
    phone?: string
  }
  /**
   * User identifier for the user to keep (the target user). Must specify one of: External ID, User Alias, Braze ID, Email, or Phone. See [the docs](https://www.braze.com/docs/api/endpoints/user_data/post_users_merge/).
   */
  identifier_to_keep: {
    /**
     * The external ID of the user to keep
     */
    external_id?: string
    /**
     * The user alias object identifying the user to keep
     */
    user_alias?: {
      alias_name?: string
      alias_label?: string
    }
    /**
     * The Braze ID of the user to keep
     */
    braze_id?: string
    /**
     * The email address of the user to keep
     */
    email?: string
    /**
     * The phone number of the user to keep in E.164 format (e.g., +14155552671)
     */
    phone?: string
  }
}
