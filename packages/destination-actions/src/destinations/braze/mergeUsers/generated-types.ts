// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of identifier for the user to be merged. One of: external_id, user_alias, email, or phone.
   */
  previousIdType: string
  /**
   * The value of the user identifier to be merged.
   */
  previousIdValue?: string
  /**
   * The value of the user alias identifier to be merged. Required if the previous identifier type is user_alias.
   */
  previousAliasIdValue?: {
    /**
     * The label of the user alias for the user to be merged.
     */
    alias_label: string
    /**
     * The name of the user alias for the user to be merged.
     */
    alias_name: string
  }
  /**
   * The type of the user identifier to be kept. One of: external_id, user_alias, email, or phone.
   */
  keepIdType: string
  /**
   * The value of the user identifier to be kept.
   */
  keepIdValue?: string
  /**
   * The value of the user alias identifier for the user to be kept. Required if the keep identifier type is user_alias.
   */
  keepAliasIdValue?: {
    /**
     * The label of the user alias to be kept.
     */
    alias_label: string
    /**
     * The name of the user alias to be kept.
     */
    alias_name: string
  }
  /**
   * Rule determining which user to merge if multiple users are found.
   */
  keepIdPrioritization?: string | null
  /**
   * Rule determining which user to merge if multiple users are found.
   */
  previousIdPrioritization?: string | null
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
