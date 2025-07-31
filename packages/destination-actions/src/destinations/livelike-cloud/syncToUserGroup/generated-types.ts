// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier for the Segment Audience.
   */
  audience_id: string
  /**
   * The name of the Segment Audience.
   */
  audience_name: string
  /**
   * Set to true to add the user to the User Group, set to false to remove the user from the User Group. If connecting to an Engage Audience, leave this field empty.
   */
  action?: boolean
  /**
   * The timestamp of the event.
   */
  timestamp: string
  /**
   * Used for trait values to send to Livelike.
   */
  additional_user_traits?: {
    /**
     * The unique LiveLike user identifier.
     */
    livelike_profile_id?: string
    /**
     * The email address of the user.
     */
    email?: string
    [k: string]: unknown
  }
  /**
   * Hidden field used to figure out if user is added or removed from an Engage Audience
   */
  traits_or_properties_hidden?: {
    [k: string]: unknown
  }
  /**
   * A unique identifier for a user.
   */
  user_id?: string
  /**
   * The number of records to process in each batch. Default is 100.
   */
  batch_size?: number
}
