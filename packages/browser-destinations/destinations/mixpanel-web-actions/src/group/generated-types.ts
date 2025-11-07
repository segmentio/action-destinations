// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Group Key / type of group to associate with the user. This group key will already be defined in your Mixpanel project.
   */
  group_key: string
  /**
   * The unique ID to associate with the group.
   */
  group_id: string
  /**
   * Group Profile Properties to set on the group in Mixpanel.
   */
  profile_properties_to_set?: {
    [k: string]: unknown
  }
  /**
   * Group Profile Properties to set once on the group profile in Mixpanel. Values which get set once cannot be overwritten later.
   */
  profile_properties_to_set_once?: {
    [k: string]: unknown
  }
}
