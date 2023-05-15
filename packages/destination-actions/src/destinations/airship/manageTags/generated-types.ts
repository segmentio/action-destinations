// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User
   */
  named_user_id?: string
  /**
   * Tag name to add or remove. Values for each tag should be boolean only. a true value creates a tag, a false value removes a tag. Non boolean values will be ignored.
   */
  tags?: {
    [k: string]: unknown
  }
  /**
   * The Tag Group to sync your tags to. Normally, this should be `segment-integration`, but set it here if it should be something else. Note: the Tag Group used must be valid and exist in Airship.
   */
  tag_group: string
}
