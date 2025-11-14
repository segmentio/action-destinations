// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Details for the group to be created or updated in Mixpanel.
   */
  group_details: {
    /**
     * The Group Key / type of group to associate with the user. This group key should already be defined in your Mixpanel project.
     */
    group_key: string
    /**
     * The unique ID to associate with the group.
     */
    group_id: string
  }
  /**
   * Group Profile Properties to set on the group in Mixpanel.
   */
  group_profile_properties_to_set?: {
    [k: string]: unknown
  }
  /**
   * Group Profile Properties to set once on the group profile in Mixpanel. Values which get set once cannot be overwritten later.
   */
  group_profile_properties_to_set_once?: {
    [k: string]: unknown
  }
  /**
   * Merge a list into a list group property. Duplicates will be removed.
   */
  group_profile_properties_to_union?: {
    /**
     * The name of the list property to union values into.
     */
    list_name: string
    /**
     * An array of string values to merge into the list. Non string lists cannot be updated. Duplicates will be removed.
     */
    string_values: string[]
  }[]
}
