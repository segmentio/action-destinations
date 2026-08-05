// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The identifier assigned in Airship as the Named User. Provide either this or Channel ID.
   */
  named_user_id?: string
  /**
   * Airship Channel ID. Provide either this or Named User ID.
   */
  channel_id?: string
  /**
   * The device type for the Channel ID (e.g. ios, android, amazon, web). Defaults to the device type from the event. If omitted or unrecognized, the generic channel key is used and Airship resolves the type, which may introduce a slight delay.
   */
  channel_type?: string
  /**
   * Tag name to add or remove. Values for each tag should be boolean only. A true value creates a tag, a false value removes a tag. Non-boolean values will be ignored.
   */
  tags?: {
    [k: string]: unknown
  }
  /**
   * The Tag Group to sync your tags to. This defaults to`segment-integration` but can be overridden with this field. Note: the Tag Group used must be valid and exist in Airship.
   */
  tag_group: string
}
